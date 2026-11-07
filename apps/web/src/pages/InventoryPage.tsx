import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

type Item = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  category: string;
  quantity: number;
};

export function InventoryPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState("common");
  const [category, setCategory] = useState("collectible");

  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () =>
      api<{ items: Item[]; goldBalance: number }>("/api/inventory"),
  });

  const goldLedger = useQuery({
    queryKey: ["gold-ledger"],
    queryFn: () =>
      api<{
        transactions: Array<{
          id: string;
          amount: number;
          memo: string | null;
          createdAt: string;
          sourceType: string;
        }>;
      }>("/api/ledger/gold"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/api/inventory", {
        method: "POST",
        body: JSON.stringify({ name, rarity, category }),
      }),
    onSuccess: async () => {
      setName("");
      await qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <div className="space-y-6">
      <section className="panel rounded-xl p-6">
        <h1 className="font-display text-3xl text-forest">Inventory</h1>
        <p className="mt-2 font-display text-2xl text-gold">
          {data?.goldBalance ?? 0} gold
        </p>
        <form className="mt-6 grid gap-3 md:grid-cols-4" onSubmit={onSubmit}>
          <input
            className="input md:col-span-2"
            placeholder="Item name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="input"
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
          >
            {["common", "uncommon", "rare", "epic", "legendary"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Add item
          </button>
          <input
            className="input md:col-span-4"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </form>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {isLoading ? <p className="text-steel">Opening satchel…</p> : null}
        {(data?.items ?? []).map((item) => (
          <article key={item.id} className="panel rounded-xl p-4">
            <div className="flex justify-between gap-2">
              <h2 className="font-display text-xl">{item.name}</h2>
              <span className="text-sm capitalize text-ember">{item.rarity}</span>
            </div>
            <p className="mt-1 text-sm text-mist">
              {item.category} · x{item.quantity}
            </p>
            {item.description ? (
              <p className="mt-2 text-sm text-steel">{item.description}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="panel rounded-xl p-5">
        <h2 className="font-display text-2xl text-forest">Gold ledger</h2>
        <ul className="mt-4 space-y-2">
          {(goldLedger.data?.transactions ?? []).map((tx) => (
            <li
              key={tx.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/40 px-3 py-2 text-sm"
            >
              <span>
                {tx.memo ?? tx.sourceType}{" "}
                <span className="text-mist">
                  {new Date(tx.createdAt).toLocaleString()}
                </span>
              </span>
              <span className={tx.amount >= 0 ? "text-forest" : "text-crimson"}>
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
