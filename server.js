console.log("RUNNING NEW CODE");
const express = require("express");
const app = express();

app.use(express.json());

app.post("/bfhl", (req, res) => {
    console.log("REQUEST HIT");
    const input = req.body.data || [];

    const validEdges = [];
    const invalid_entries = [];
    const duplicate_edges = [];

    const seen = new Set();

    for (let str of input) {
        if (!str || typeof str !== "string") {
            invalid_entries.push(str);
            continue;
        }

        str = str.trim();

        if (!/^[A-Z]->[A-Z]$/.test(str)) {
            invalid_entries.push(str);
            continue;
        }

        const [u, v] = str.split("->");

        if (u === v) {
            invalid_entries.push(str);
            continue;
        }

        if (seen.has(str)) {
            if (!duplicate_edges.includes(str)) {
                duplicate_edges.push(str);
            }
            continue;
        }

        seen.add(str);
        validEdges.push([u, v]);
    }

    const graph = {};
    const parent = {};
    const nodes = new Set();
    const childSet = new Set();

    for (let [u, v] of validEdges) {
        nodes.add(u);
        nodes.add(v);

        if (parent[v]) continue;

        parent[v] = u;
        childSet.add(v);

        if (!graph[u]) graph[u] = [];
        graph[u].push(v);
    }

    const visitedGlobal = new Set();
    const hierarchies = [];

    let total_trees = 0;
    let total_cycles = 0;
    let maxDepth = 0;
    let largest_tree_root = "";

    function detectCycle(node, visited, recStack) {
        if (!visited.has(node)) {
            visited.add(node);
            recStack.add(node);

            for (let nei of (graph[node] || [])) {
                if (!visited.has(nei) && detectCycle(nei, visited, recStack)) return true;
                else if (recStack.has(nei)) return true;
            }
        }
        recStack.delete(node);
        return false;
    }

    function buildTree(node) {
        let obj = {};
        for (let nei of (graph[node] || [])) {
            obj[nei] = buildTree(nei);
        }
        return obj;
    }

    function getDepth(node) {
        if (!graph[node] || graph[node].length === 0) return 1;
        let max = 0;
        for (let nei of graph[node]) {
            max = Math.max(max, getDepth(nei));
        }
        return max + 1;
    }

    for (let node of nodes) {
        if (visitedGlobal.has(node)) continue;

        const comp = [];
        const stack = [node];

        while (stack.length) {
            const n = stack.pop();
            if (visitedGlobal.has(n)) continue;
            visitedGlobal.add(n);
            comp.push(n);

            for (let nei of (graph[n] || [])) stack.push(nei);
            for (let p in graph) {
                if (graph[p].includes(n)) stack.push(p);
            }
        }

        let root = comp.find(n => !childSet.has(n));
        if (!root) root = comp.sort()[0];

        const hasCycle = detectCycle(root, new Set(), new Set());

        if (hasCycle) {
            total_cycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            total_trees++;
            const tree = {};
            tree[root] = buildTree(root);
            const depth = getDepth(root);

            if (depth > maxDepth || (depth === maxDepth && root < largest_tree_root)) {
                maxDepth = depth;
                largest_tree_root = root;
            }

            hierarchies.push({
                root,
                tree,
                depth
            });
        }
    }

    res.json({
        user_id: "jasenzephaniah11",
        email_id: "jw3897@srmist.edu.in",
        college_roll_number: "RA2311003050338",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
