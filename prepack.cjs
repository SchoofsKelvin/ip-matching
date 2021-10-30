const rimraf = require("rimraf");
const child_process = require("child_process");
const readline = require("readline");

async function spawn(prefix, cmd, args) {
  console.log(`[${prefix}] Process started`);
  const cp = child_process.spawn(cmd, args, {
    shell: true,
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  readline.createInterface({ input: cp.stdout }).on("line", (line) => {
    console.log(`[${prefix}] ${line}`);
  });
  readline.createInterface({ input: cp.stderr }).on("line", (line) => {
    console.error(`[${prefix}] ${line}`);
  });
  return new Promise((resolve, reject) => {
    cp.once("error", reject);
    cp.once("close", (code) => {
      console.log(`[${prefix}] Process ended with status code ${code}`);
      if (!code) return resolve();
      reject(new Error(`Process ${prefix} exited with code ${code}`));
    });
  });
}

function clean() {
  return new Promise((resolve, reject) =>
    rimraf("lib", (err) => {
      if (!err) return resolve();
      reject(new Error(`Error during clean: ${err.stack || err}`));
    })
  );
}

async function build() {
  // Start cleaning and linting
  const cleanPromise = clean();
  const lintPromise = spawn("Lint", "yarn", ["lint"]);

  // Start compiling CJS and EMS after cleaning is done
  const cjsPromise = cleanPromise.then(() => spawn("CJS", "yarn", ["compile"]));
  const esmPromise = cleanPromise.then(() => spawn("ESM", "yarn", ["compile:esm"]));

  // Start API after CJS is done (which also outputs types)
  const apiPromise = cjsPromise.then(() => spawn("API", "yarn", ["api"]));

  // Start testing after CJS and EMS are done
  const testPromise = Promise.all([cjsPromise, esmPromise]).then(() => spawn("Test", "yarn", ["test"]));

  // Wait for all unlinked promises to finish
  await Promise.all([lintPromise, apiPromise, testPromise]);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
