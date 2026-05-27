import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const BASE_URL = "https://graph.facebook.com/v19.0";

const server = new McpServer({ name: "meta-ads-mcp", version: "1.0.0" });

server.tool("get_ad_accounts", {}, async () => {
  const res = await fetch(`${BASE_URL}/me/adaccounts?fields=id,name,account_status,currency,amount_spent&access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("get_campaigns", { ad_account_id: z.string() }, async ({ ad_account_id }) => {
  const res = await fetch(`${BASE_URL}/act_${ad_account_id}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,insights{impressions,clicks,spend,ctr,cpm,actions}&access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("get_adsets", { campaign_id: z.string() }, async ({ campaign_id }) => {
  const res = await fetch(`${BASE_URL}/${campaign_id}/adsets?fields=id,name,status,daily_budget,targeting,optimization_goal,billing_event,insights{impressions,clicks,spend,ctr,cpm,actions,reach,frequency}&access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("get_ads", { adset_id: z.string() }, async ({ adset_id }) => {
  const res = await fetch(`${BASE_URL}/${adset_id}/ads?fields=id,name,status,creative{id,name,body,title,image_url,video_id},insights{impressions,clicks,spend,ctr,cpm,actions,reach,frequency}&access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("get_ad_creatives", { ad_account_id: z.string() }, async ({ ad_account_id }) => {
  const res = await fetch(`${BASE_URL}/act_${ad_account_id}/adcreatives?fields=id,name,body,title,image_url,video_id,object_story_spec&access_token=${ACCESS_TOKEN}`);
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("create_campaign", {
  ad_account_id: z.string(),
  name: z.string(),
  objective: z.string(),
  daily_budget: z.number(),
  status: z.string().optional()
}, async ({ ad_account_id, name, objective, daily_budget, status = "PAUSED" }) => {
  const res = await fetch(`${BASE_URL}/act_${ad_account_id}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, objective, daily_budget: daily_budget * 100, status, access_token: ACCESS_TOKEN })
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("create_adset", {
  ad_account_id: z.string(),
  campaign_id: z.string(),
  name: z.string(),
  daily_budget: z.number(),
  optimization_goal: z.string(),
  billing_event: z.string(),
  targeting: z.string(),
  status: z.string().optional()
}, async ({ ad_account_id, campaign_id, name, daily_budget, optimization_goal, billing_event, targeting, status = "PAUSED" }) => {
  const res = await fetch(`${BASE_URL}/act_${ad_account_id}/adsets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, campaign_id, daily_budget: daily_budget * 100, optimization_goal, billing_event, targeting: JSON.parse(targeting), status, access_token: ACCESS_TOKEN })
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("create_ad", {
  ad_account_id: z.string(),
  adset_id: z.string(),
  name: z.string(),
  creative_id: z.string(),
  status: z.string().optional()
}, async ({ ad_account_id, adset_id, name, creative_id, status = "PAUSED" }) => {
  const res = await fetch(`${BASE_URL}/act_${ad_account_id}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, adset_id, creative: { creative_id }, status, access_token: ACCESS_TOKEN })
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("update_campaign_status", {
  campaign_id: z.string(),
  status: z.enum(["ACTIVE", "PAUSED", "DELETED"])
}, async ({ campaign_id, status }) => {
  const res = await fetch(`${BASE_URL}/${campaign_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, access_token: ACCESS_TOKEN })
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("update_budget", {
  campaign_id: z.string(),
  daily_budget: z.number()
}, async ({ campaign_id, daily_budget }) => {
  const res = await fetch(`${BASE_URL}/${campaign_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daily_budget: daily_budget * 100, access_token: ACCESS_TOKEN })
  });
  const data = await res.json();
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

export default async function handler(req, res) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
