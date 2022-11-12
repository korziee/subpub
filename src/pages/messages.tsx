import React from "react";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from "next";
import superjson from "superjson";
import { router } from "../services/router";

export default function MessagesPage({
  messages,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div>
      <h1>Messages</h1>
      <pre>{JSON.stringify(messages, null, 2)}</pre>
    </div>
  );
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = createProxySSGHelpers({
    router,
    transformer: superjson,
    ctx: {},
  });

  const messages = await ssg.getMessages.fetch({
    subscriptionName: "numbers-subscription-1",
    batchSize: 10,
  });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      messages,
    },
    revalidate: 1,
  };
};
