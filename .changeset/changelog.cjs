const path = require("path");
const { execSync } = require("child_process");
const pkgJson = require("../package.json");

const getCommitChangelog = (commitHash) => {
  const repoPath = path.resolve(__dirname, "..");

  const stdout = execSync(
    `git --no-pager show ${commitHash} --format="%s%n%h%n%H"  -s`,
    { cwd: repoPath, encoding: "utf-8" }
  );

  const [subject, abbrevHash, hash] = stdout
    .replace(/\"/g, "")
    .split("\n")
    .filter((entry) => entry.length !== 0);
  return `${subject} ([${abbrevHash}](${pkgJson.homepage}/commits/${hash}))`;
};

const getReleaseLine = async (changeset, _type) => {
  const [firstLine, ...futureLines] = changeset.summary
    .split("\n")
    .map((l) => l.trimRight());

  let returnVal = `- ${
    changeset.commit ? `${getCommitChangelog(changeset.commit)} ` : firstLine
  }`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map((l) => `  ${l}`).join("\n")}`;
  }

  return returnVal;
};

const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) return "";
  const changesetLinks = changesets.map(
    (changeset) =>
      `- Updated dependencies${
        changeset.commit ? ` [${changeset.commit}]` : ""
      }`
  );
  const updatedDepenenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
  );
  return [...changesetLinks, ...updatedDepenenciesList].join("\n");
};

const defaultChangelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

module.exports = defaultChangelogFunctions;
