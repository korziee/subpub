import React from "react";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import superjson from "superjson";
import { router } from "../services/router";
import { monitoringTrpc, trpc } from "../utils/trpc";
import { monitoringRouter } from "../services/monitoring";

export default function Statistics({
  stats,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div>
      <h1>Statistics</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = createProxySSGHelpers({
    router: monitoringRouter,
    transformer: superjson,
    ctx: {},
  });

  const stats = await ssg.getStats.fetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
      stats,
    },
    revalidate: 1,
  };
};
