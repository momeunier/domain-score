declare module "whois-json" {
  function whois(domain: string): Promise<{
    registrar?: string;
    creationDate?: string;
    expirationDate?: string;
    updatedDate?: string;
    nameServers?: string[];
    status?: string;
  }>;
  export default whois;
}
