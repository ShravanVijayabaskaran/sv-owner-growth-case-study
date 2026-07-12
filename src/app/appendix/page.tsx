import fs from "node:fs";
import path from "node:path";
import { Stack, Row, Stat, SectionHeading, Eyebrow, H1 } from "@/components/ui";
import { SqlBlock } from "@/components/SqlBlock";
import { QUERY_DESCRIPTIONS } from "@/data/queries";

function loadSql() {
  const dir = path.join(process.cwd(), "content", "sql");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  return files.map((name) => {
    const code = fs.readFileSync(path.join(dir, name), "utf8");
    return { name, code, lines: code.split("\n").length };
  });
}

export default function Appendix() {
  const files = loadSql();
  const totalLines = files.reduce((a, f) => a + f.lines, 0);

  return (
    <Stack gap={28}>
      <Stack gap={12}>
        <Eyebrow>Appendix — source queries</Eyebrow>
        <H1>All SQL</H1>
      </Stack>

      <Row gap={24} wrap>
        <Stat value={files.length.toString()} label="SQL files" tone="info" />
        <Stat value={totalLines.toLocaleString()} label="lines of SQL + comments" tone="neutral" />
      </Row>

      <SectionHeading title="Queries" sub="Click a file to expand. Use Copy to grab the full text." />
      <Stack gap={12}>
        {files.map((f) => {
          const meta = QUERY_DESCRIPTIONS[f.name] ?? { title: "Query", page: "", blurb: "" };
          return <SqlBlock key={f.name} name={f.name} title={meta.title} page={meta.page} blurb={meta.blurb} code={f.code} lines={f.lines} />;
        })}
      </Stack>
    </Stack>
  );
}
