import { useState } from "react";
import Filters from "@/features/requests/components/GraphQLQuery/components/Filters";
import GraphQLSchemaProvider from "@/features/requests/components/GraphQLQuery/context/GraphQLSchemaProvider";

export default function FiltersFixture() {
  const [filterData, setFilterData] = useState<any>({});
  const [open, setOpen] = useState(true);
  const data = [
    {
      name: "where",
      inputObjects: [
        { name: "age", operations: [{ name: "eq" }, { name: "in" }] },
        { name: "name", operations: [{ name: "eq" }] },
      ],
    },
  ];
  return (
    <GraphQLSchemaProvider.Provider
      value={{ filterData, setFilterData, refreshCheck: () => {} }}
    >
      <button onClick={() => setOpen(true)}>Reopen filters</button>
      {open && (
        <Filters
          open={open}
          data={data}
          path="query"
          onCancel={() => setOpen(false)}
        />
      )}
      <output aria-label="Filter data">{JSON.stringify(filterData)}</output>
    </GraphQLSchemaProvider.Provider>
  );
}
