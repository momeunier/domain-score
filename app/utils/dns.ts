const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";

interface DnsResponse {
  Status: number;
  Answer?: {
    name: string;
    type: number;
    TTL: number;
    data: string;
  }[];
}

async function dnsQuery(domain: string, type: string) {
  try {
    const response = await fetch(
      `${DOH_ENDPOINT}?name=${domain}&type=${type}`,
      {
        headers: {
          accept: "application/dns-json",
        },
      }
    );
    return (await response.json()) as DnsResponse;
  } catch (error) {
    console.error(`DNS query error for ${domain} (${type}):`, error);
    return null;
  }
}

export async function getMXRecords(domain: string) {
  try {
    const response = await dnsQuery(domain, "MX");
    if (!response?.Answer) return [];

    return response.Answer.map((record) => {
      const [priority, exchange] = record.data.split(" ");
      return {
        priority: parseInt(priority),
        exchange: exchange.replace(/\.$/, ""), // Remove trailing dot
      };
    }).sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error("Error getting MX records:", error);
    return [];
  }
}

export async function getSPFRecord(domain: string): Promise<string | null> {
  try {
    const response = await dnsQuery(domain, "TXT");
    if (!response?.Answer) return null;

    const spfRecord = response.Answer.find((record) =>
      record.data.toLowerCase().includes("v=spf1")
    );
    return spfRecord ? spfRecord.data.replace(/^"|"$/g, "") : null;
  } catch (error) {
    console.error("Error checking SPF record:", error);
    return null;
  }
}

export async function getDMARCRecord(domain: string): Promise<string | null> {
  try {
    const response = await dnsQuery(`_dmarc.${domain}`, "TXT");
    if (!response?.Answer) return null;

    const dmarcRecord = response.Answer.find((record) =>
      record.data.toLowerCase().includes("v=dmarc1")
    );
    return dmarcRecord ? dmarcRecord.data.replace(/^"|"$/g, "") : null;
  } catch (error) {
    console.error("Error checking DMARC record:", error);
    return null;
  }
}
