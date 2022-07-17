import { exec } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { copy } from 'fs-extra';
import { prompt, QuestionCollection, Separator } from 'inquirer';
import ncu from 'npm-check-updates';
import { join } from 'path';

import { getLicense, getLicenses, writeLicense } from './licenses';

export default async function start(options: Options): Promise<void> {
	const questions: QuestionCollection<{ name?: string; license: string; description?: string }>[] = [];
	const licenseNames = await getLicenses();

	options.name === ':P' &&
		questions.push({
			message: 'Please enter your Project Name',
			name: 'name',
		});

	options.description === ':P' &&
		questions.push({
			message: 'Please enter your Project Description',
			name: 'description',
		});

	questions.push({
		choices: [...licenseNames, new Separator()],
		default: 'MIT License (MIT)',
		message: 'Please choose a License for your Project',
		name: 'license',
		type: 'list',
	});

	if (questions.length !== 0) {
		const { description, name, license } = await prompt(questions);
		options.license = license.split('(')[1].split(')')[0];
		options.name === ':P' && (options.name = name!);
		options.description === ':P' && (options.description = description!);
	}

	const targetDir = join(process.cwd(), `./${options.name}`);
	const templateDir = join(__dirname, '../templates/typescript');

	await mkdir(targetDir);
	await copy(templateDir, targetDir);

	const packageJSON = (await import(join(targetDir, './package.json'))) as { [key: string]: unknown };
	packageJSON.name = options.name.split(' ').join('-').toLowerCase();
	packageJSON.description = options.description;
	packageJSON.license = options.license;

	await writeFile(join(targetDir, './package.json'), JSON.stringify(packageJSON));
	await writeLicense(targetDir, options.license, await getLicense(options.license));

	await ncu({ cwd: join(targetDir, './package.json'), target: 'latest', upgrade: true });

	exec(`cd ./${targetDir} && npm install && ${process.env.EDITOR ?? 'code'} .`);
	console.log('Successfully Initialized your Project');
}

export interface Options {
	description: string;
	name: string;
	help: false;
	license: string;
}
