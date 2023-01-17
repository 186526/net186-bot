import { Address4, Address6 } from "ip-address";
import { isIPv4, isIPv6 } from "net";

export default (address: string): Address4 | Address6 => {
	if (isIPv4(address)) return new Address4(address);
	if (isIPv6(address)) return new Address6(address);
	throw new Error("Invalid address");
};
