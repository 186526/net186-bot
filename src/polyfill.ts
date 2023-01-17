if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function (
		searchValue: string | RegExp,
		replaceValue: string | ((substring: string, ...args: any[]) => string)
	): string {
		if (typeof replaceValue == "function") throw new Error("Not Supported.");
		// If a regex pattern
		if (
			Object.prototype.toString.call(searchValue).toLowerCase() ===
			"[object regexp]"
		) {
			return this.replace(searchValue, replaceValue);
		}

		// If a string
		return this.replace(new RegExp(searchValue, "g"), replaceValue);
	};
}
