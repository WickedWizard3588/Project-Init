import axios from 'axios';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const getLicenses = async (): Promise<string[]> => {
	const allLicense = await axios.get<BasicLicense[]>('https://api.github.com/licenses');
	const licenses = [];
	for (const license of allLicense.data) licenses.push(`${license.name} (${license.spdx_id})`);
	return licenses;
};

export const getLicense = async (licenseName: string): Promise<string> => {
	const license = await axios.get<License>(`https://api.github.com/licenses/${licenseName}`);
	return license.data.body;
};

export const writeLicense = async (targetDir: string, licenseName: string, licenseData: string): Promise<void> => {
	if (
		licenseName === 'BSD-2-Clause' ||
		licenseName === 'BSD-3-Clause' ||
		licenseName === 'MIT' ||
		licenseName === 'MPL-2.0'
	) {
		licenseData = licenseData.replace('[year]', `${new Date().getFullYear()}`);
		licenseData = licenseData.replace('[fullname]', 'Chiranthan Bharadwaj R (chiranthan568@gmail.com)');
		await writeFile(join(targetDir, './LICENSE'), licenseData);
	} else if (licenseName === 'Unlicense') {
		await writeFile(join(targetDir, './UNLICENSE'), licenseData);
	} else {
		await writeFile(join(targetDir, './LICENSE'), licenseData);
	}
};

export interface BasicLicense {
	key: string;
	name: string;
	spdx_id: string;
	url: string;
	node_id: string;
}

export interface License extends BasicLicense {
	html_url: string;
	description: string;
	implementation: string;
	permissions: string[];
	conditions: string[];
	limitations: string[];
	body: string;
	featured: boolean;
}
