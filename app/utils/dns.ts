import { promises as dns } from "dns";

export async function getMXRecords(domain: string) {
  try {
    const records = await dns.resolveMx(domain);

    return records.map((record) => ({
      priority: record.priority,
      exchange: record.exchange,
    }));
  } catch (error) {
    console.error("Error getting MX records:", error);
    return [];
  }
}

export async function getSPFRecord(domain: string): Promise<string | null> {
  try {
    const records = await dns.resolveTxt(domain);
    const spfRecord = records
      .flat()
      .find((record) => record.toLowerCase().startsWith("v=spf1"));
    return spfRecord || null;
  } catch (error) {
    console.error("Error checking SPF record:", error);
    return null;
  }
}

export async function getDMARCRecord(domain: string): Promise<string | null> {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarcRecord = records
      .flat()
      .find((record) => record.toLowerCase().includes("v=dmarc1"));
    return dmarcRecord || null;
  } catch (error) {
    console.error("Error checking DMARC record:", error);
    return null;
  }
}
