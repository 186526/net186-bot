import axios, { AxiosInstance } from "axios";
import { Address4, Address6 } from 'ip-address';

interface deviceRaw {
	name: string;
	network: {
		name: string;
		display_name: string;
	};
	vrfs: {
		name: string;
		display_name: string;
	}[];
}

interface queryTypeRaw {
	name: capabilities;
	display_name: string;
	enable: boolean;
}

export default class Hyperglass implements adapter {
	private axiosInstance: AxiosInstance;
	constructor(link: string) {
		this.axiosInstance = axios.create({
			baseURL: link,
			headers: {
				"Content-Type": "application/json",
			},
			transformRequest: [
				(data: object) => {
					return JSON.stringify(data);
				},
			],
			transformResponse: [
				(data: string) => {
					return JSON.parse(data);
				},
			],
			validateStatus: function (status) {
				return status < 500;
			}
		});
		this.axiosInstance.get("/api/info").then((r) => {
			if (!(r.data.version as string).includes("hyperglass")) {
				throw new Error(
					"Not found hyperglass in /api/info. Please check your Hyperglass URL."
				);
			}
		});
	}

	async info(): Promise<info> {
		const response = await this.axiosInstance.get("/api/info");
		return {
			name: response.data.name,
			organization: response.data.organization,
		};
	}

	async devicesRaw(): Promise<deviceRaw[]> {
		const response = await this.axiosInstance.get("/api/devices");
		return response.data as deviceRaw[];
	}
	async listQueiesTypeRaw(): Promise<queryTypeRaw[]> {
		const response = await this.axiosInstance.get("/api/queries");
		return response.data as queryTypeRaw[];
	}

	async capabilities(): Promise<capabilities[]> {
		return (await this.listQueiesTypeRaw()).reduce(
			(previous: capabilities[], current) => {
				if (current.enable) {
					previous.push(current.name);
				}
				return previous;
			},
			[]
		);
	}
	async devices(): Promise<device[]> {
		const devicesRaw = await this.devicesRaw();
		const globalCapabilities = await this.capabilities();
		return devicesRaw.map((k) => {
			return {
				name: k.name,
				group: k.network.display_name,
				capabilities: globalCapabilities,
				vrfs: k.vrfs.map((k) => k.name),
			};
		});
	}
    async query(capability: capabilities, device: device, vrf: string, target: Address4 | Address6): Promise<queryError | querySuccess> {
        
        const response = await this.axiosInstance.post("api/query/", {
			query_location: device.name.replace(/[^A-Za-z0-9\_\-\s]/g,"").replaceAll(" ","_").toLowerCase(),
			query_target: target.address,
			query_vrf: vrf,
			query_type: capability,
		});

		if (response.status == 200) {
			return {
				level: response.data.level as "success",
				output: response.data.output as string,
				timestamp: new Date(response.data.timestamp),
			} as querySuccess;
		} else if (response.status == 400) {
			return {
				level: response.data.level as "danger",
				output: "Request Content Error: " + response.data.output as string,
			} as queryError;
		} else if (response.status == 422) {
			return {
				level: response.data.level as "danger",
				output: "Request Format Error: " + response.data.output as string,
			} as queryError;
		} else if (response.status == 500) {
			return {
				level: response.data.level as "danger",
				output: "Server Error: " + response.data.output as string,
			} as queryError;
		} else {
			return {
				level: "danger",
				output: "Unknown Error.",
			} as queryError;
		}
    }
}
