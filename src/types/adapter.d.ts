enum capabilities {
	"BGP Route" = "bgp_route",
	"Ping" = "ping",
	"Traceroute" = "traceroute",
}

interface info {
	name: string;
	organization: string;
}

interface device {
	name: string;
	group: string;
	capabilities: capabilities[];
	vrfs: string[];
}

interface queryResponse {
	level: "warning" | "error" | "danger";
}

interface queryError extends queryResponse {
	output?: string;
}

interface querySuccess extends queryResponse {
	level: "success";
	output: string;
	timestamp: Date;
}

interface adapter {
	info(): Promise<info>;
	devices(): Promise<device[]>;
	query(
		capability: capabilities,
		device: device,
		vrf: string,
		target: import("ip-address").Address4 | import("ip-address").Address6,
	): Promise<queryError | querySuccess>;
}
