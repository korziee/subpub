package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

type partition struct {
	id    string
	node  string
	stats partitionStats
}

type partitionStats struct {
	PendingMessagesCount   int
	InflightMessagesCount  int
	OldestMessageTimestamp time.Duration
}

type stat struct {
	SubscriptionName string `json:"subscriptionName"`
	PartitionId      string `json:"partitionId"`
	Node             string `json:"node"`
	Stats            struct {
		PendingMessagesCount   int           `json:"pendingMessagesCount"`
		InflightMessagesCount  int           `json:"inflightMessagesCount"`
		OldestMessageTimestamp time.Duration `json:"oldestMessageTimestamp"`
	} `json:"stats"`
}

type response struct {
	Result struct {
		Data []stat `json:"data"`
	} `json:"result"`
}

type model struct {
	sub           chan map[string]subscription // where we'll receive activity notifications
	subscriptions map[string]subscription
	quitting      bool
}

type subscription struct {
	name       string
	partitions []partition
}

var POLL_TIMER time.Duration = 500

func fetchMonitoringData() map[string]subscription {

	url := "http://localhost:2022/getStats"

	client := http.Client{
		Timeout: time.Second * 2, // Timeout after 2 seconds
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		log.Fatal(err)
	}

	res, getErr := client.Do(req)
	if getErr != nil {
		log.Fatal(getErr)
	}

	if res.Body != nil {
		defer res.Body.Close()
	}

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		log.Fatal(readErr)
	}

	resp := response{}

	if jsonErr := json.Unmarshal(body, &resp); jsonErr != nil {
		log.Fatal(jsonErr)
	}

	// Marshal into map

	subscriptionMap := make(map[string]subscription)

	for _, stat := range resp.Result.Data {
		val := subscriptionMap[stat.SubscriptionName]
		ptr := &val

		// fmt.Println(ptr)
		// TODO: Is there a better way to do this?
		if ptr.name == "" {
			val = subscription{
				name:       stat.SubscriptionName,
				partitions: []partition{},
			}
		}

		val.partitions = append(val.partitions, partition{
			id:   stat.PartitionId,
			node: stat.Node,
			stats: partitionStats{
				PendingMessagesCount:   stat.Stats.PendingMessagesCount,
				InflightMessagesCount:  stat.Stats.InflightMessagesCount,
				OldestMessageTimestamp: stat.Stats.OldestMessageTimestamp,
			},
		})

		subscriptionMap[stat.SubscriptionName] = val

	}

	return subscriptionMap
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
		listenForActivity(m.sub), // generate activity
		waitForActivity(m.sub),   // wait for activity
	)
}

func listenForActivity(sub chan map[string]subscription) tea.Cmd {
	return func() tea.Msg {
		for {
			time.Sleep(time.Millisecond * POLL_TIMER)
			sub <- fetchMonitoringData()
		}
	}
}

// A command that waits for the activity on a channel.
func waitForActivity(sub chan map[string]subscription) tea.Cmd {
	return func() tea.Msg {
		return map[string]subscription(<-sub)
	}
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg.(type) {
	case tea.KeyMsg:
		m.quitting = true
		return m, tea.Quit
	case map[string]subscription:
		m.subscriptions = msg.(map[string]subscription) // record external activity
		return m, waitForActivity(m.sub)                // wait for next event
	default:
		return m, nil
	}
}

func (m model) View() string {
	var msg string

	if m.quitting {
		return "\n  See you later!\n\n"
	}

	for _, sub := range m.subscriptions {
		msg = fmt.Sprintf("Subscription: \"%s\" messages\n\n", sub.name)

		for _, partition := range sub.partitions {
			msg += fmt.Sprintf("Partition id: \"%s\"\n", partition.id)
			msg += fmt.Sprintf("Inflight: \"%d\"\n", partition.stats.InflightMessagesCount)
			msg += fmt.Sprintf("Oldest: \"%d\"\n", partition.stats.OldestMessageTimestamp)
			msg += fmt.Sprintf("Pending: \"%d\"\n\n", partition.stats.PendingMessagesCount)
		}
		msg += "\n\n\n"
	}

	return msg
}

func main() {
	p := tea.NewProgram(model{
		sub:           make(chan map[string]subscription),
		subscriptions: make(map[string]subscription),
	})

	if _, err := p.Run(); err != nil {
		fmt.Println("could not start program:", err)
		os.Exit(1)
	}
}
