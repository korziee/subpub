package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

type model struct {
	sub       chan response // where we'll receive activity notifications
	statsMap  map[string]stat
	responses int // how many responses we've received
	quitting  bool
}

func (m model) Init() tea.Cmd {
	return tea.Batch(
	// listenForActivity(m.sub), // generate activity
	// waitForActivity(m.sub),   // wait for activity
	)
}

// A command that waits for the activity on a channel.
func waitForActivity(sub chan response) tea.Cmd {
	return func() tea.Msg {
		return response(<-sub)
	}
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg.(type) {
	case tea.KeyMsg:
		m.quitting = true
		return m, tea.Quit
	case response:
		msg.data
		m.responses++                    // record external activity
		return m, waitForActivity(m.sub) // wait for next event
	default:
		return m, nil
	}
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

type res struct {
	Data []stat `json:"data"`
}

type response struct {
	Result res `json:"result"`
}

func read() []stat {
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

	return resp.Result.Data
}

func main() {
	// data := read()

	// fmt.Println(data)

	rand.Seed(time.Now().UTC().UnixNano())

	p := tea.NewProgram(model{
		sub:      make(chan response),
		statsMap: make(map[string]stat),
	})

	if _, err := p.Run(); err != nil {
		fmt.Println("could not start program:", err)
		os.Exit(1)
	}
}
