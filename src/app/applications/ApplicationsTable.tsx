"use client";
import { useState } from "react";
import StatusFilter from "./StatusFilter";
import DeleteButton from "./DeleteButton";
import StatusSelect from "./StatusSelect";

export default function ApplicationsTable({ apps }: { apps: any[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  const filtered =
    filter === null ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="overflow-x-auto">
      <StatusFilter
        statuses={["SAVED","APPLIED","OA","INTERVIEW","OFFER","REJECTED","WITHDRAWN"]}
        onChange={setFilter}
      />
      <table className="min-w-full border rounded-xl text-sm">
        <thead className="bg-black/10">
          <tr>
            <th className="text-left p-3 border-b">Company</th>
            <th className="text-left p-3 border-b">Position</th>
            <th className="text-left p-3 border-b">Status</th>
            <th className="text-left p-3 border-b">Applied</th>
            <th className="text-left p-3 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a.id} className="hover:bg-black/5">
              <td className="p-3 border-b">{a.job.company.name}</td>
              <td className="p-3 border-b">{a.job.title}</td>
              <td className="p-3 border-b">
                <StatusSelect id={a.id} value={a.status} />
              </td>
              <td className="p-3 border-b">
                {new Date(a.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3 border-b">
                <DeleteButton id={a.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}