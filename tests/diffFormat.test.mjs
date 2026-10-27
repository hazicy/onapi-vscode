import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadFormatter,
  fixture,
  authTypes,
} from "./helpers/diffFormatFixture.mjs";
const plain = (value) => JSON.parse(JSON.stringify(value));
const api = await loadFormatter();
for (const name of [
  "formatApis",
  "formatWebSocket",
  "formatSocketIo",
  "formatGraphql",
]) {
  test(`${name} retains common parameter fields, labels and required flags`, () => {
    const input = fixture();
    const snapshot = structuredClone(input);
    const result = plain(api[name](input));
    assert.deepEqual(result.header, [
      {
        "[supplement.key]key": "key",
        "[supplement.value]value": "value",
        "[supplement.file_type]field_type": "String",
        "[supplement.desc]description": "Description",
        "[supplement.required]not_null": "supplement.yes",
      },
    ]);
    assert.deepEqual(result.base_info["[supplement.status]mark"], "Done");
    assert.deepEqual(input, snapshot);
    const empty = plain(api[name]({}));
    assert.deepEqual(empty.header, []);
  });
}
for (const type of authTypes) {
  test(`${type} auth formatting is consistent across HTTP and GraphQL without leaking previous auth fields`, () => {
    const input = fixture(type);
    assert.deepEqual(
      plain(api.formatApis(input).auth),
      plain(api.formatGraphql(input).auth),
    );
    const noauth = plain(api.formatApis(fixture("noauth")).auth);
    assert.deepEqual(Object.keys(noauth), ["[supplement.type]type"]);
  });
}
test("parameter formatting keeps optional flags and protocol-specific sections intact", () => {
  const input = fixture("basic", "form-data");
  input.request.header.parameter[0] = {
    ...input.request.header.parameter[0],
    not_null: -1,
  };
  assert.equal(
    api.formatApis(input).header[0]["[supplement.required]not_null"],
    "supplement.no",
  );
  assert.deepEqual(
    plain(api.formatApis(input).cookie),
    plain(api.formatGraphql(input).cookie),
  );
  const graphql = plain(api.formatGraphql(input));
  assert.deepEqual(graphql.query[0]["[Variables]variables"], { id: 1 });
  const socket = plain(api.formatSocketIo(input));
  assert.equal(socket.event[0]["[supplement.listen]listen"], true);
});
