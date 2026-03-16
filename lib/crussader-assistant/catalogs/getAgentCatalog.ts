// lib/crussader-assistant/catalog/getAgentCatalog.ts

import { prisma } from "@/lib/prisma";

export type AgentCatalogStatus =
  | "PENDING"
  | "ACTIVE"
  | "INACTIVE"
  | "DEPRECATED";

export type AgentCatalogCapability = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
  isVisible: boolean;
  sortOrder: number;
  actions: AgentCatalogAction[];
  products: AgentCatalogProduct[];
};

export type AgentCatalogAction = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
};

export type AgentCatalogProduct = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
  items: AgentCatalogItem[];
};

export type AgentCatalogItem = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
};

type CapabilityRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
  is_visible: boolean;
  sort_order: number | null;
};

type ActionRow = {
  capability_id: string;
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
};

type ProductRow = {
  capability_id: string;
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
};

type ItemRow = {
  product_id: string;
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: AgentCatalogStatus;
};

export async function getAgentCatalog() {
  const capabilities = await prisma.$queryRaw<CapabilityRow[]>`
    SELECT
      c.id,
      c.key,
      c.label,
      c.description,
      c.status::text as status,
      c.is_visible,
      c.sort_order
    FROM agent_cat_capability c
    ORDER BY c.sort_order ASC, c.key ASC
  `;

  const actions = await prisma.$queryRaw<ActionRow[]>`
    SELECT
      ca.capability_id,
      a.id,
      a.key,
      a.label,
      a.description,
      a.status::text as status
    FROM agent_cat_capability_action ca
    JOIN agent_cat_action a
      ON a.id = ca.action_id
    ORDER BY a.key ASC
  `;

  const products = await prisma.$queryRaw<ProductRow[]>`
    SELECT
      cp.capability_id,
      p.id,
      p.key,
      p.label,
      p.description,
      p.status::text as status
    FROM agent_cat_capability_product cp
    JOIN agent_cat_product p
      ON p.id = cp.product_id
    ORDER BY p.key ASC
  `;

  const items = await prisma.$queryRaw<ItemRow[]>`
    SELECT
      pi.product_id,
      i.id,
      i.key,
      i.label,
      i.description,
      i.status::text as status
    FROM agent_cat_product_item pi
    JOIN agent_cat_item i
      ON i.id = pi.item_id
    ORDER BY i.key ASC
  `;

  const itemsByProductId = new Map<string, AgentCatalogItem[]>();

  for (const item of items) {
    const list = itemsByProductId.get(item.product_id) || [];

    list.push({
      id: item.id,
      key: item.key,
      label: item.label,
      description: item.description,
      status: item.status
    });

    itemsByProductId.set(item.product_id, list);
  }

  const productsByCapabilityId = new Map<string, AgentCatalogProduct[]>();

  for (const product of products) {
    const list = productsByCapabilityId.get(product.capability_id) || [];

    list.push({
      id: product.id,
      key: product.key,
      label: product.label,
      description: product.description,
      status: product.status,
      items: itemsByProductId.get(product.id) || []
    });

    productsByCapabilityId.set(product.capability_id, list);
  }

  const actionsByCapabilityId = new Map<string, AgentCatalogAction[]>();

  for (const action of actions) {
    const list = actionsByCapabilityId.get(action.capability_id) || [];

    list.push({
      id: action.id,
      key: action.key,
      label: action.label,
      description: action.description,
      status: action.status
    });

    actionsByCapabilityId.set(action.capability_id, list);
  }

  const catalog: AgentCatalogCapability[] = capabilities.map((capability) => {
    return {
      id: capability.id,
      key: capability.key,
      label: capability.label,
      description: capability.description,
      status: capability.status,
      isVisible: capability.is_visible,
      sortOrder: capability.sort_order || 0,
      actions: actionsByCapabilityId.get(capability.id) || [],
      products: productsByCapabilityId.get(capability.id) || []
    };
  });

  return catalog;
}