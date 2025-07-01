const sha256 = require("./sha256");

function hashData(data) {
  return sha256(JSON.stringify(data));
}

function buildMerkleTree(leaves) {
  if (!Array.isArray(leaves) || leaves.length === 0) return [""];

  let level = leaves.map((leaf) => hashData(leaf));

  while (level.length > 1) {
    const nextLevel = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;

      const parentHash = sha256(left + right);
      nextLevel.push(parentHash);
    }

    level = nextLevel;
  }

  return level[0]; // root hash
}

module.exports = { buildMerkleTree };
