import * as core from "@actions/core";
import fs from "fs";
import process from "process";
import { execFile } from "child_process";
import { promisify } from "util";

const butlerPath = core.getInput("butler");
if (!fs.existsSync(butlerPath)) {
  core.error(
    `Could not find butler at path ${butlerPath}. working directory: ${process.cwd()}`,
  );
  process.exit(1);
}

const artifactPaths = core.getInput("artifactPaths");
let uploadPath = artifactPaths;
let uploadFiles = [artifactPaths];
try {
  uploadPath = JSON.parse(artifactPaths);
  core.info(`ArtifactPaths: ${artifactPaths}`);
} catch (ex) {
  core.info(
    `Caught exception parsing artifactPaths input as json, assuming it's a path. Exception: ${ex}`,
  );
}

if (uploadPath.length) {
  // note: expects artifactPaths to be in the tauri-action format: https://github.com/tauri-apps/tauri-action/blob/51a9f1156b33df106d827c3a78f8f894946c5faa/src/types.d.ts#L19-L30
  uploadFiles = uploadPath.map((p) => p.path);
  // uploadPath = fs.mkdtempSync("itchio-upload");
  // core.info(
  //   `created temp path ${uploadPath}, copying ${uploadPath.length} file(s) to it: ${JSON.stringify(uploadFiles)}`,
  // );
  // uploadFiles.forEach((f) => fs.copyFileSync(f, `${uploadPath}/${f}`));
}

core.info(`ArtifactPaths: ${uploadFiles.join(", ")}`);

const project = core.getInput("project");
const channel = core.getInput("channel");
const version = core.getInput("version");
const api_key = core.getInput("api_key");

const customEnv = {
  ...process.env,
  BUTLER_API_KEY: api_key,
};
const options = {
  env: customEnv,
};

const promises = [];
uploadFiles.forEach(f => {
  const extension = f.split('.').pop();
  const args = ["push", f, `${project}:${channel}-${extension}`];
  if (version) {
    args.concat(["--userversion", version]);
  }
  core.info(`From ${process.cwd()}, Running ${butlerPath} ${args.join(" ")}`);
  const promise = promisify(execFile);
  const promisedUpload = promise(butlerPath, args, options, (error, stdout, stderr) => {
    if (error) {
      core.warning(`execFile error: ${error}`);
    }

    core.info(`stdout: ${stdout}`);
    core.warning(`stderr: ${stderr}`);
  });
  promises.push(promisedUpload);
});

Promise.allSettled(promises).then(results => {
  core.info("All Butler calls complete:");
  core.info(results);
});
