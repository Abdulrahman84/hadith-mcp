import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createHadithMcpServer } from "../src/index.js";

describe("MCP server smoke test", () => {
  it("lets an MCP client list and call fixture-backed tools", async () => {
    const server = createHadithMcpServer();
    const client = new Client({
      name: "hadith-mcp-test-client",
      version: "0.0.0"
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          "list_collections",
          "fetch_hadith",
          "search_hadith",
          "validate_hadith_reference",
          "get_hadith_metadata",
          "get_hadith_grade"
        ])
      );

      const result = await client.callTool({
        name: "fetch_hadith",
        arguments: {
          collection: "bukhari",
          hadith_number: "1"
        }
      });

      expect(result.structuredContent).toMatchObject({
        result: {
          collection: "bukhari",
          hadith_number: "1",
          source_dataset: "fixture-only/non-release"
        }
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
