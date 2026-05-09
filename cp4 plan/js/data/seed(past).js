const SEED_DATA = {
  weeks: [
    {
      weekNum: 1,
      title: "Introduction",
      officialPlan: "Week 01: Introduction - Chapter 1",
      chapters: ["Chapter 1"],
      isMidBreakAfter: false,
      days: [
        {
          dayNum: 1,
          topic: "Competitive Programming + Competitions Overview",
          chapterRef: "1.1, 1.2",
          sections: [
            { key: "w1d1_1.1", title: "1.1 Competitive Programming" },
            { key: "w1d1_1.2", title: "1.2 The Competitions" },
            { key: "w1d1_1.2.1", title: "1.2.1 IOI" },
            { key: "w1d1_1.2.2", title: "1.2.2 ICPC" },
            { key: "w1d1_1.2.3", title: "1.2.3 Other Programming Contests" }
          ]
        },
        {
          dayNum: 2,
          topic: "Tips 1-3",
          chapterRef: "1.3.1-1.3.3",
          sections: [
            { key: "w1d2_1.3.1", title: "Tip 1" },
            { key: "w1d2_1.3.2", title: "Tip 2" },
            { key: "w1d2_1.3.3", title: "Tip 3" }
          ]
        },
        {
          dayNum: 3,
          topic: "Tips 4-7",
          chapterRef: "1.3.4-1.3.7",
          sections: [
            { key: "w1d3_1.3.4", title: "Tip 4" },
            { key: "w1d3_1.3.5", title: "Tip 5" },
            { key: "w1d3_1.3.6", title: "Tip 6" },
            { key: "w1d3_1.3.7", title: "Tip 7" }
          ]
        },
        {
          dayNum: 4,
          topic: "Getting Started",
          chapterRef: "1.4",
          sections: [
            { key: "w1d4_1.4.1", title: "Anatomy of Contest Problem" },
            { key: "w1d4_1.4.2", title: "I/O Routines" },
            { key: "w1d4_1.4.3", title: "Start Journey" },
            { key: "w1d4_1.4.4", title: "First AC" }
          ]
        },
        {
          dayNum: 5,
          topic: "Basic String Processing",
          chapterRef: "1.5",
          sections: [{ key: "w1d5_1.5", title: "Basic String Processing Skills" }]
        },
        {
          dayNum: 6,
          topic: "Ad Hoc Problems (1)",
          chapterRef: "1.6",
          sections: [{ key: "w1d6_1.6a", title: "Ad Hoc Problems First Half" }]
        },
        {
          dayNum: 7,
          topic: "Ad Hoc (2) + Exercises + Notes",
          chapterRef: "1.6,1.7,1.8",
          sections: [
            { key: "w1d7_1.6b", title: "Ad Hoc Problems Second Half" },
            { key: "w1d7_1.7", title: "Exercises" },
            { key: "w1d7_1.8", title: "Chapter Notes" }
          ]
        }
      ],
      checklist: [
        "Read all of Chapter 1 completely",
        "Solved 10+ ad hoc problems",
        "Comfortable with fast I/O",
        "Understand time complexity analysis",
        "Set up local CP template file"
      ]
    },
    {
      weekNum: 2,
      title: "Data Structures & Libraries",
      officialPlan: "Week 02: Data Structures & Libraries - Chapter 2+9",
      chapters: ["Chapter 2", "Chapter 9 (9.1-9.4)"],
      isMidBreakAfter: false,
      days: [
        {
          dayNum: 1,
          topic: "Overview + Arrays + Special Sorting",
          chapterRef: "2.1,2.2.1,2.2.2",
          sections: [
            { key: "w2d1_2.1", title: "Overview" },
            { key: "w2d1_2.2.1", title: "Array" },
            { key: "w2d1_2.2.2", title: "Special Sorting" }
          ]
        },
        {
          dayNum: 2,
          topic: "Bitmask + Big Integer",
          chapterRef: "2.2.3,2.2.4",
          sections: [
            { key: "w2d2_2.2.3", title: "Bitmask" },
            { key: "w2d2_2.2.4", title: "Big Integer" }
          ]
        },
        {
          dayNum: 3,
          topic: "Linked DS + Stack Problems",
          chapterRef: "2.2.5,2.2.6",
          sections: [
            { key: "w2d3_2.2.5", title: "Linked Data Structures" },
            { key: "w2d3_2.2.6", title: "Stack-based Problems" }
          ]
        },
        {
          dayNum: 4,
          topic: "Non-Linear DS",
          chapterRef: "2.3",
          sections: [
            { key: "w2d4_2.3.1", title: "Binary Heap" },
            { key: "w2d4_2.3.2", title: "Hash Table" },
            { key: "w2d4_2.3.3", title: "bBST" },
            { key: "w2d4_2.3.4", title: "Order Statistics Tree" }
          ]
        },
        {
          dayNum: 5,
          topic: "Graph + Union-Find",
          chapterRef: "2.4.1,2.4.2",
          sections: [
            { key: "w2d5_2.4.1", title: "Graph Representation" },
            { key: "w2d5_2.4.2", title: "Union-Find DS" }
          ]
        },
        {
          dayNum: 6,
          topic: "Fenwick Tree",
          chapterRef: "2.4.3",
          sections: [{ key: "w2d6_2.4.3", title: "Fenwick Tree" }]
        },
        {
          dayNum: 7,
          topic: "Segment Tree + Rare DS",
          chapterRef: "2.4.4,2.5,2.6,9.1-9.4",
          sections: [
            { key: "w2d7_2.4.4", title: "Segment Tree" },
            { key: "w2d7_2.5", title: "Exercises" },
            { key: "w2d7_2.6", title: "Chapter Notes" },
            { key: "w2d7_9.1", title: "9.1 Overview" },
            { key: "w2d7_9.2", title: "9.2 Sliding Window" },
            { key: "w2d7_9.3", title: "9.3 Sparse Table" },
            { key: "w2d7_9.4", title: "9.4 Sqrt Decomp" }
          ]
        }
      ],
      checklist: [
        "Implemented Union-Find",
        "Implemented Fenwick Tree",
        "Implemented Segment Tree",
        "Implemented Sliding Window",
        "Understand Sparse Table",
        "Understand Sqrt Decomposition",
        "Know when to use each data structure"
      ]
    },
    {
      weekNum: 3,
      title: "Complete Search",
      officialPlan: "Week 03: Complete Search - Chapter 3+8+9",
      chapters: ["Chapter 3 (3.1,3.2)", "Chapter 8 (8.1,8.2)", "Chapter 9 (9.6,9.20,9.21,9.22)"],
      isMidBreakAfter: false,
      days: [
        {
          dayNum: 1,
          topic: "Overview + Iterative Complete Search",
          chapterRef: "3.1,3.2.1",
          sections: [
            { key: "w3d1_3.1", title: "Overview" },
            { key: "w3d1_3.2.1", title: "Iterative Complete Search" }
          ]
        },
        {
          dayNum: 2,
          topic: "Recursive Complete Search",
          chapterRef: "3.2.2",
          sections: [{ key: "w3d2_3.2.2", title: "Recursive Complete Search" }]
        },
        {
          dayNum: 3,
          topic: "Tips + Contest Usage",
          chapterRef: "3.2.3,3.2.4",
          sections: [
            { key: "w3d3_3.2.3", title: "Complete Search Tips" },
            { key: "w3d3_3.2.4", title: "In Contests" }
          ]
        },
        {
          dayNum: 4,
          topic: "Ch8 Overview + Backtracking with Bitmask",
          chapterRef: "8.1,8.2.1",
          sections: [
            { key: "w3d4_8.1", title: "8.1 More Advanced Topics - Overview and Motivation" },
            { key: "w3d4_8.2.1", title: "Backtracking with Bitmask" }
          ]
        },
        {
          dayNum: 5,
          topic: "State-space + Meet in the Middle",
          chapterRef: "8.2.2,8.2.3",
          sections: [
            { key: "w3d5_8.2.2", title: "State-Space Search" },
            { key: "w3d5_8.2.3", title: "Meet in the Middle" }
          ]
        },
        {
          dayNum: 6,
          topic: "A*/IDA* + Pancake",
          chapterRef: "9.20,9.21",
          sections: [
            { key: "w3d6_9.20", title: "A* and IDA*" },
            { key: "w3d6_9.21", title: "Pancake Sorting" }
          ]
        },
        {
          dayNum: 7,
          topic: "Tower of Hanoi + Egg Dropping",
          chapterRef: "9.6,9.22",
          sections: [
            { key: "w3d7_9.6", title: "Tower of Hanoi" },
            { key: "w3d7_9.22", title: "Egg Dropping Puzzle" }
          ]
        }
      ],
      checklist: [
        "Solved iterative complete search problems",
        "Solved recursive backtracking problems",
        "Implemented pruning",
        "Implemented meet in the middle",
        "Understand A* and IDA*",
        "Understand state-space search"
      ]
    },
    {
      weekNum: 4,
      title: "Dynamic Programming",
      officialPlan: "Week 04: Dynamic Programming - Chapter 3+8+9",
      chapters: ["Chapter 3 (3.5)", "Chapter 8 (8.3)", "Chapter 9 (9.7,9.23)"],
      isMidBreakAfter: false,
      days: [
        {
          dayNum: 1,
          topic: "DP Illustration",
          chapterRef: "3.5.1",
          sections: [{ key: "w4d1_3.5.1", title: "DP Illustration" }]
        },
        {
          dayNum: 2,
          topic: "Classical DP",
          chapterRef: "3.5.2",
          sections: [{ key: "w4d2_3.5.2", title: "Classical Examples" }]
        },
        {
          dayNum: 3,
          topic: "Non-Classical + Contest",
          chapterRef: "3.5.3,3.5.4",
          sections: [
            { key: "w4d3_3.5.3", title: "Non-Classical Examples" },
            { key: "w4d3_3.5.4", title: "DP in Contests" }
          ]
        },
        {
          dayNum: 4,
          topic: "Advanced DP 1",
          chapterRef: "8.3.1-8.3.4",
          sections: [
            { key: "w4d4_8.3.1", title: "DP with Bitmask" },
            { key: "w4d4_8.3.2", title: "Common DP Parameters" },
            { key: "w4d4_8.3.3", title: "Negative Offset Handling" },
            { key: "w4d4_8.3.4", title: "State Optimization" }
          ]
        },
        {
          dayNum: 5,
          topic: "Advanced DP 2",
          chapterRef: "8.3.5-8.3.9",
          sections: [
            { key: "w4d5_8.3.5", title: "Reduce Parameters" },
            { key: "w4d5_8.3.6", title: "Multi-test optimization" },
            { key: "w4d5_8.3.7", title: "Hash memo" },
            { key: "w4d5_8.3.8", title: "Binary search optimization" },
            { key: "w4d5_8.3.9", title: "Other DP techniques" }
          ]
        },
        {
          dayNum: 6,
          topic: "Matrix Chain + DP Optimization",
          chapterRef: "9.7,9.23",
          sections: [
            { key: "w4d6_9.7", title: "Matrix Chain Multiplication" },
            { key: "w4d6_9.23", title: "DP Optimization" }
          ]
        },
        {
          dayNum: 7,
          topic: "Review Day",
          chapterRef: "Review",
          sections: [{ key: "w4d7_review", title: "Review all DP sections" }]
        }
      ],
      checklist: [
        "Solved 10+ DP problems",
        "Implemented bitmask DP",
        "Know LIS/Knapsack/LCS/Coin",
        "Understand advanced DP techniques",
        "Implemented matrix chain",
        "Know Knuth and CHT concepts"
      ]
    },
    {
      weekNum: 5,
      title: "Buffer Slot - D&C + Greedy + Graph",
      officialPlan: "Week 05: Buffer slot - Chapter 3/4/9/others",
      chapters: ["Chapter 3 (3.3,3.4,3.6,3.7)", "Chapter 4 (all)", "Chapter 9 (9.5,9.8,9.9)"],
      isMidBreakAfter: false,
      days: [
        {
          dayNum: 1,
          topic: "Divide and Conquer",
          chapterRef: "3.3",
          sections: [
            { key: "w5d1_3.3.1", title: "Binary Search Usages" },
            { key: "w5d1_3.3.2", title: "Ternary Search" },
            { key: "w5d1_3.3.3", title: "D&C in Contests" }
          ]
        },
        {
          dayNum: 2,
          topic: "Greedy",
          chapterRef: "3.4",
          sections: [
            { key: "w5d2_3.4.1", title: "Greedy Examples" },
            { key: "w5d2_3.4.2", title: "Greedy in Contests" }
          ]
        },
        {
          dayNum: 3,
          topic: "Graph Traversal Basics",
          chapterRef: "4.1,4.2.1-4.2.6",
          sections: [
            { key: "w5d3_4.1", title: "Graph Overview" },
            { key: "w5d3_4.2.2", title: "DFS" },
            { key: "w5d3_4.2.3", title: "BFS" },
            { key: "w5d3_4.2.6", title: "Topological Sort" }
          ]
        },
        {
          dayNum: 4,
          topic: "Advanced Traversal",
          chapterRef: "4.2.7-4.2.11",
          sections: [
            { key: "w5d4_4.2.7", title: "Bipartite Check" },
            { key: "w5d4_4.2.8", title: "Cycle Check" },
            { key: "w5d4_4.2.9", title: "Bridges" },
            { key: "w5d4_4.2.10", title: "SCC" }
          ]
        },
        {
          dayNum: 5,
          topic: "MST + SSSP",
          chapterRef: "4.3,4.4",
          sections: [
            { key: "w5d5_4.3.2", title: "Kruskal" },
            { key: "w5d5_4.3.3", title: "Prim" },
            { key: "w5d5_4.4.2", title: "BFS SSSP" },
            { key: "w5d5_4.4.3", title: "Dijkstra" },
            { key: "w5d5_4.4.4", title: "Bellman-Ford" }
          ]
        },
        {
          dayNum: 6,
          topic: "APSP + Special Graphs + Rare Trees",
          chapterRef: "4.5,4.6,4.7,4.8,9.5,9.8,9.9",
          sections: [
            { key: "w5d6_4.5.2", title: "Floyd-Warshall" },
            { key: "w5d6_4.6.1", title: "DAG" },
            { key: "w5d6_4.6.2", title: "Tree" },
            { key: "w5d6_4.7", title: "Exercises" },
            { key: "w5d6_4.8", title: "Chapter Notes" },
            { key: "w5d6_9.5", title: "HLD" },
            { key: "w5d6_9.8", title: "LCA" },
            { key: "w5d6_9.9", title: "Tree Isomorphism" }
          ]
        },
        {
          dayNum: 7,
          topic: "Ch3 Wrap + Catch-up",
          chapterRef: "3.6,3.7",
          sections: [
            { key: "w5d7_3.6", title: "Exercises" },
            { key: "w5d7_3.7", title: "Chapter Notes" },
            { key: "w5d7_catchup", title: "Catch-up" }
          ]
        }
      ],
      checklist: [
        "Completed D&C and Greedy",
        "Implemented DFS/BFS/Dijkstra",
        "Implemented Kruskal and Prim",
        "Implemented Floyd-Warshall",
        "Implemented SCC and Bridges",
        "Know LCA/HLD/Tree Isomorphism"
      ]
    },
    {
      weekNum: 6,
      title: "Mid-Semester Team Contest - Entire Book 1",
      officialPlan: "Week 06: Mid-Semester Team Contest - Entire Book 1",
      chapters: ["Review Ch1-4", "Review Ch8.1-8.3", "Review Ch9 studied so far"],
      isMidBreakAfter: true,
      days: [
        { dayNum: 1, topic: "Review Ch1", chapterRef: "Review", sections: [{ key: "w6d1_rev1", title: "Review Chapter 1" }] },
        { dayNum: 2, topic: "Review Ch2", chapterRef: "Review", sections: [{ key: "w6d2_rev2", title: "Review Chapter 2 + 9.1-9.4" }] },
        { dayNum: 3, topic: "Review Ch3", chapterRef: "Review", sections: [{ key: "w6d3_rev3", title: "Review Chapter 3" }] },
        { dayNum: 4, topic: "Review Ch4", chapterRef: "Review", sections: [{ key: "w6d4_rev4", title: "Review Chapter 4 + 9.5/9.8/9.9" }] },
        { dayNum: 5, topic: "Review Ch8 and Ch9", chapterRef: "Review", sections: [{ key: "w6d5_rev5", title: "Review 8.1-8.3" }, { key: "w6d5_rev6", title: "Review 9.6/9.7/9.20-9.23" }] },
        { dayNum: 6, topic: "Mock Contest", chapterRef: "Contest", sections: [{ key: "w6d6_mock", title: "Timed mock contest" }] },
        { dayNum: 7, topic: "Mid-Sem Team Contest", chapterRef: "Contest", sections: [{ key: "w6d7_contest", title: "Mid-Semester Team Contest" }] }
      ],
      checklist: [
        "Reviewed all Ch1-Ch4",
        "Template file tested",
        "Completed mock contest",
        "Upsolved mock problems",
        "Participated in mid-semester contest"
      ]
    },
    {
      weekNum: 7,
      title: "Graph 1 - Network Flow",
      officialPlan: "Week 07: Graph 1 (Network Flow) - Chapter 8+9",
      chapters: ["8.4", "9.24", "9.25"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Overview + Ford-Fulkerson", chapterRef: "8.4.1,8.4.2", sections: [{ key: "w7d1_8.4.1", title: "Flow Overview" }, { key: "w7d1_8.4.2", title: "Ford-Fulkerson" }] },
        { dayNum: 2, topic: "Edmonds-Karp", chapterRef: "8.4.3", sections: [{ key: "w7d2_8.4.3", title: "Edmonds-Karp" }] },
        { dayNum: 3, topic: "Dinic", chapterRef: "8.4.4", sections: [{ key: "w7d3_8.4.4", title: "Dinic" }] },
        { dayNum: 4, topic: "Classic Modeling", chapterRef: "8.4.5", sections: [{ key: "w7d4_8.4.5", title: "Classic Modeling" }] },
        { dayNum: 5, topic: "Non-Classic + Contest", chapterRef: "8.4.6,8.4.7", sections: [{ key: "w7d5_8.4.6", title: "Non-Classic Modeling" }, { key: "w7d5_8.4.7", title: "Flow in Contests" }] },
        { dayNum: 6, topic: "Push-Relabel", chapterRef: "9.24", sections: [{ key: "w7d6_9.24", title: "Push-Relabel" }] },
        { dayNum: 7, topic: "Min Cost Flow", chapterRef: "9.25", sections: [{ key: "w7d7_9.25", title: "Min Cost Flow" }] }
      ],
      checklist: [
        "Implemented Ford-Fulkerson",
        "Implemented Edmonds-Karp",
        "Implemented Dinic",
        "Implemented Push-Relabel",
        "Implemented Min Cost Max Flow"
      ]
    },
    {
      weekNum: 8,
      title: "Graph 2 - Matching",
      officialPlan: "Week 08: Graph 2 (Matching) - Chapter 8+9",
      chapters: ["8.5", "9.10", "9.26-9.29"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Matching Overview", chapterRef: "8.5.1,8.5.2", sections: [{ key: "w8d1_8.5.1", title: "Matching Overview" }, { key: "w8d1_8.5.2", title: "Variants" }] },
        { dayNum: 2, topic: "Unweighted MCBM", chapterRef: "8.5.3", sections: [{ key: "w8d2_8.5.3", title: "Unweighted MCBM" }] },
        { dayNum: 3, topic: "Hopcroft-Karp", chapterRef: "9.26", sections: [{ key: "w8d3_9.26", title: "Hopcroft-Karp" }] },
        { dayNum: 4, topic: "Weighted + Hungarian", chapterRef: "8.5.4,9.27", sections: [{ key: "w8d4_8.5.4", title: "Weighted Matching" }, { key: "w8d4_9.27", title: "Hungarian" }] },
        { dayNum: 5, topic: "Blossom", chapterRef: "9.28", sections: [{ key: "w8d5_9.28", title: "Edmonds Blossom" }] },
        { dayNum: 6, topic: "De Bruijn + Chinese Postman", chapterRef: "9.10,9.29", sections: [{ key: "w8d6_9.10", title: "De Bruijn" }, { key: "w8d6_9.29", title: "Chinese Postman" }] },
        { dayNum: 7, topic: "Review flow + matching", chapterRef: "Review", sections: [{ key: "w8d7_review", title: "Review 8.4 and 8.5" }] }
      ],
      checklist: [
        "Implemented augmenting path MCBM",
        "Implemented Hopcroft-Karp",
        "Implemented Hungarian",
        "Understand Blossom",
        "Solved matching problems"
      ]
    },
    {
      weekNum: 9,
      title: "NP-hard / Complete Problems",
      officialPlan: "Week 09: NP-hard/complete Problems - Chapter 8",
      chapters: ["8.6-8.9", "9.30-9.33"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "NP-hard part 1", chapterRef: "8.6", sections: [{ key: "w9d1_8.6a", title: "NP-hard part 1" }] },
        { dayNum: 2, topic: "NP-hard part 2", chapterRef: "8.6", sections: [{ key: "w9d2_8.6b", title: "NP-hard part 2" }] },
        { dayNum: 3, topic: "NP-hard part 3", chapterRef: "8.6", sections: [{ key: "w9d3_8.6c", title: "NP-hard part 3" }] },
        { dayNum: 4, topic: "Problem Decomposition 1", chapterRef: "8.7", sections: [{ key: "w9d4_8.7a", title: "Problem Decomposition (first half)" }] },
        { dayNum: 5, topic: "Problem Decomposition 2 + notes", chapterRef: "8.7,8.8,8.9", sections: [{ key: "w9d5_8.7b", title: "Problem Decomposition (second half)" }, { key: "w9d5_8.8", title: "Exercises" }, { key: "w9d5_8.9", title: "Chapter Notes" }] },
        { dayNum: 6, topic: "Constructive + Interactive", chapterRef: "9.30,9.31", sections: [{ key: "w9d6_9.30", title: "Constructive" }, { key: "w9d6_9.31", title: "Interactive" }] },
        { dayNum: 7, topic: "Linear Programming + Gradient Descent", chapterRef: "9.32,9.33", sections: [{ key: "w9d7_9.32", title: "Linear Programming" }, { key: "w9d7_9.33", title: "Gradient Descent" }] }
      ],
      checklist: [
        "Can identify NP-hard problems",
        "Know common reductions",
        "Know approximation vs exact",
        "Understand decomposition patterns",
        "Handled constructive and interactive problems"
      ]
    },
    {
      weekNum: 10,
      title: "Mathematics",
      officialPlan: "Week 10: Mathematics - Chapter 5+9",
      chapters: ["Chapter 5 all", "9.12-9.17"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Overview + primes", chapterRef: "5.1,5.2,5.3.1,5.3.2", sections: [{ key: "w10d1_5.1", title: "Overview" }, { key: "w10d1_5.2", title: "Ad Hoc Math" }, { key: "w10d1_5.3.1", title: "Prime Numbers" }, { key: "w10d1_5.3.2", title: "Probabilistic Prime" }] },
        { dayNum: 2, topic: "Prime factors and gcd", chapterRef: "5.3.3-5.3.6", sections: [{ key: "w10d2_5.3.3", title: "Prime Factors" }, { key: "w10d2_5.3.4", title: "Factor functions" }, { key: "w10d2_5.3.5", title: "Modified sieve" }, { key: "w10d2_5.3.6", title: "GCD/LCM" }] },
        { dayNum: 3, topic: "Mod arithmetic + ext euclid", chapterRef: "5.3.7-5.3.11", sections: [{ key: "w10d3_5.3.7", title: "Factorial" }, { key: "w10d3_5.3.8", title: "Working with factors" }, { key: "w10d3_5.3.9", title: "Mod arithmetic" }, { key: "w10d3_5.3.10", title: "Extended Euclid" }, { key: "w10d3_5.3.11", title: "Number theory in contests" }] },
        { dayNum: 4, topic: "Combinatorics", chapterRef: "5.4", sections: [{ key: "w10d4_5.4.1", title: "Fibonacci" }, { key: "w10d4_5.4.2", title: "Binomial" }, { key: "w10d4_5.4.3", title: "Catalan" }, { key: "w10d4_5.4.4", title: "Combinatorics in contests" }] },
        { dayNum: 5, topic: "Probability + cycle + game theory", chapterRef: "5.5,5.6,5.7", sections: [{ key: "w10d5_5.5", title: "Probability" }, { key: "w10d5_5.6.1", title: "Cycle finding problem" }, { key: "w10d5_5.6.2", title: "Cycle DS solution" }, { key: "w10d5_5.6.3", title: "Floyd cycle finding" }, { key: "w10d5_5.7", title: "Game theory" }] },
        { dayNum: 6, topic: "Matrix power + notes", chapterRef: "5.8,5.9,5.10", sections: [{ key: "w10d6_5.8.1", title: "Matrix power intro" }, { key: "w10d6_5.8.2", title: "Fast mod power" }, { key: "w10d6_5.8.3", title: "Matrix modular power" }, { key: "w10d6_5.8.4", title: "DP speed-up" }, { key: "w10d6_5.9", title: "Exercises" }, { key: "w10d6_5.10", title: "Chapter Notes" }] },
        { dayNum: 7, topic: "Rare math day", chapterRef: "9.12-9.17", sections: [{ key: "w10d7_9.12", title: "Pollard's Rho" }, { key: "w10d7_9.13", title: "CRT" }, { key: "w10d7_9.14", title: "Lucas" }, { key: "w10d7_9.15", title: "Rare theorems" }, { key: "w10d7_9.16", title: "Combinatorial game theory" }, { key: "w10d7_9.17", title: "Gaussian elimination" }] }
      ],
      checklist: [
        "Implemented sieve",
        "Implemented Miller-Rabin",
        "Implemented extended GCD",
        "Know CRT and Lucas",
        "Implemented Gaussian elimination"
      ]
    },
    {
      weekNum: 11,
      title: "String Processing",
      officialPlan: "Week 11: String Processing (esp Suffix Array) - Chapter 6",
      chapters: ["Chapter 6 all", "9.11"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Overview + Ad Hoc", chapterRef: "6.1,6.2", sections: [{ key: "w11d1_6.1", title: "Overview" }, { key: "w11d1_6.2", title: "Ad Hoc String" }] },
        { dayNum: 2, topic: "String DP", chapterRef: "6.3", sections: [{ key: "w11d2_6.3.1", title: "Edit Distance" }, { key: "w11d2_6.3.2", title: "LCS" }, { key: "w11d2_6.3.3", title: "Non-classical DP" }] },
        { dayNum: 3, topic: "String Matching", chapterRef: "6.4", sections: [{ key: "w11d3_6.4.1", title: "Library solutions" }, { key: "w11d3_6.4.2", title: "KMP" }, { key: "w11d3_6.4.3", title: "2D string matching" }] },
        { dayNum: 4, topic: "Suffix Trie/Tree", chapterRef: "6.5.1-6.5.3", sections: [{ key: "w11d4_6.5.1", title: "Suffix Trie" }, { key: "w11d4_6.5.2", title: "Suffix Tree" }, { key: "w11d4_6.5.3", title: "Suffix Tree Applications" }] },
        { dayNum: 5, topic: "Suffix Array Focus", chapterRef: "6.5.4,6.5.5", sections: [{ key: "w11d5_6.5.4", title: "Suffix Array" }, { key: "w11d5_6.5.5", title: "Suffix Array Applications" }] },
        { dayNum: 6, topic: "Hashing", chapterRef: "6.6", sections: [{ key: "w11d6_6.6.1", title: "Hashing a string" }, { key: "w11d6_6.6.2", title: "Rolling hash" }, { key: "w11d6_6.6.3", title: "Rabin-Karp" }, { key: "w11d6_6.6.4", title: "Collision probability" }] },
        { dayNum: 7, topic: "Anagram + Palindrome + FFT", chapterRef: "6.7,6.8,6.9,9.11", sections: [{ key: "w11d7_6.7.1", title: "Anagram" }, { key: "w11d7_6.7.2", title: "Palindrome" }, { key: "w11d7_9.11", title: "FFT" }, { key: "w11d7_6.8", title: "Exercises" }, { key: "w11d7_6.9", title: "Chapter Notes" }] }
      ],
      checklist: [
        "Implemented KMP",
        "Implemented Z algorithm",
        "Implemented suffix array and LCP",
        "Implemented Rabin-Karp",
        "Solved string problems"
      ]
    },
    {
      weekNum: 12,
      title: "Computational Geometry",
      officialPlan: "Week 12: (Computational) Geometry - Chapter 7+9",
      chapters: ["Chapter 7 all", "9.18", "9.19"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Overview + Points", chapterRef: "7.1,7.2.1", sections: [{ key: "w12d1_7.1", title: "Overview" }, { key: "w12d1_7.2.1", title: "Points" }] },
        { dayNum: 2, topic: "Lines", chapterRef: "7.2.2", sections: [{ key: "w12d2_7.2.2", title: "Lines" }] },
        { dayNum: 3, topic: "Circles + Triangles", chapterRef: "7.2.3,7.2.4", sections: [{ key: "w12d3_7.2.3", title: "Circles" }, { key: "w12d3_7.2.4", title: "Triangles" }] },
        { dayNum: 4, topic: "Quadrilateral + Polygon Basics", chapterRef: "7.2.5,7.3.1-7.3.3", sections: [{ key: "w12d4_7.2.5", title: "Quadrilaterals" }, { key: "w12d4_7.3.1", title: "Polygon representation" }, { key: "w12d4_7.3.2", title: "Perimeter" }, { key: "w12d4_7.3.3", title: "Area" }] },
        { dayNum: 5, topic: "Convexity + inside polygon + cut", chapterRef: "7.3.4-7.3.6", sections: [{ key: "w12d5_7.3.4", title: "Convexity check" }, { key: "w12d5_7.3.5", title: "Point inside polygon" }, { key: "w12d5_7.3.6", title: "Cutting polygon" }] },
        { dayNum: 6, topic: "Convex Hull + 3D", chapterRef: "7.3.7,7.4", sections: [{ key: "w12d6_7.3.7", title: "Convex hull" }, { key: "w12d6_7.4", title: "3D geometry" }] },
        { dayNum: 7, topic: "Art Gallery + Closest Pair + notes", chapterRef: "9.18,9.19,7.5,7.6", sections: [{ key: "w12d7_9.18", title: "Art Gallery" }, { key: "w12d7_9.19", title: "Closest Pair" }, { key: "w12d7_7.5", title: "Exercises" }, { key: "w12d7_7.6", title: "Chapter Notes" }] }
      ],
      checklist: [
        "Complete geometry library built",
        "Implemented convex hull",
        "Implemented closest pair",
        "Solved geometry problems"
      ]
    },
    {
      weekNum: 13,
      title: "Final Team Contest - Entire Book 1+2 and Beyond",
      officialPlan: "Week 13: Final Team Contest - Entire Book 1+2 and beyond",
      chapters: ["Full review Ch1-Ch9", "9.34"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Review DS + Complete Search", chapterRef: "Review", sections: [{ key: "w13d1_rev", title: "Review DS + Complete Search" }] },
        { dayNum: 2, topic: "Review DP", chapterRef: "Review", sections: [{ key: "w13d2_rev", title: "Review DP" }] },
        { dayNum: 3, topic: "Review Graph/Flow/Matching", chapterRef: "Review", sections: [{ key: "w13d3_rev", title: "Review Graph/Flow/Matching" }] },
        { dayNum: 4, topic: "Review Math + String", chapterRef: "Review", sections: [{ key: "w13d4_rev", title: "Review Math + String" }] },
        { dayNum: 5, topic: "Review Geometry + NP-hard + 9.34", chapterRef: "Review", sections: [{ key: "w13d5_rev", title: "Review Geometry + NP-hard" }, { key: "w13d5_9.34", title: "9.34 Chapter Notes" }] },
        { dayNum: 6, topic: "Full Timed Mock Contest", chapterRef: "Contest", sections: [{ key: "w13d6_mock", title: "Full timed mock contest" }] },
        { dayNum: 7, topic: "Final Team Contest", chapterRef: "Contest", sections: [{ key: "w13d7_contest", title: "Final Team Contest" }] }
      ],
      checklist: [
        "Template file tested",
        "Reviewed weak topics",
        "Mock contest completed",
        "Upsolve queue cleared",
        "Participated in final contest"
      ]
    },
    {
      weekNum: 14,
      title: "FINAL TEST",
      officialPlan: "Week 14: FINAL TEST",
      chapters: ["Entire CP4 book", "9.34 revisit"],
      isMidBreakAfter: false,
      days: [
        { dayNum: 1, topic: "Review confused sections", chapterRef: "Review", sections: [{ key: "w14d1_review", title: "Review all confused sections" }] },
        { dayNum: 2, topic: "Hard exercises Ch3+Ch4", chapterRef: "3.6,3.7,4.7,4.8", sections: [{ key: "w14d2_3.6", title: "3.6 revisit" }, { key: "w14d2_3.7", title: "3.7 revisit" }, { key: "w14d2_4.7", title: "4.7 revisit" }, { key: "w14d2_4.8", title: "4.8 revisit" }] },
        { dayNum: 3, topic: "Hard exercises Ch5+Ch8", chapterRef: "5.9,5.10,8.8,8.9", sections: [{ key: "w14d3_5.9", title: "5.9 revisit" }, { key: "w14d3_5.10", title: "5.10 revisit" }, { key: "w14d3_8.8", title: "8.8 revisit" }, { key: "w14d3_8.9", title: "8.9 revisit" }] },
        { dayNum: 4, topic: "Hard exercises Ch6+Ch7", chapterRef: "6.8,6.9,7.5,7.6", sections: [{ key: "w14d4_6.8", title: "6.8 revisit" }, { key: "w14d4_6.9", title: "6.9 revisit" }, { key: "w14d4_7.5", title: "7.5 revisit" }, { key: "w14d4_7.6", title: "7.6 revisit" }] },
        { dayNum: 5, topic: "Template polish + 9.34", chapterRef: "9.34", sections: [{ key: "w14d5_9.34", title: "9.34 final read" }, { key: "w14d5_tmpl", title: "Template final polish" }] },
        { dayNum: 6, topic: "Virtual contest + upsolve queue clear", chapterRef: "Contest", sections: [{ key: "w14d6_vc", title: "Virtual Contest" }] },
        { dayNum: 7, topic: "Final Test", chapterRef: "Final", sections: [{ key: "w14d7_final", title: "FINAL TEST" }] }
      ],
      checklist: [
        "FINAL TEST completed",
        "Wrong answers analyzed",
        "Upsolve queue cleared",
        "DOOM NOTES finalized",
        "Template library fully tested"
      ]
    }
  ],

  ch9Map: {
    "9.1  Overview": { week: 2, day: 7, key: "w2d7_9.1" },
    "9.2  Sliding Window": { week: 2, day: 7, key: "w2d7_9.2" },
    "9.3  Sparse Table": { week: 2, day: 7, key: "w2d7_9.3" },
    "9.4  Sqrt Decomp": { week: 2, day: 7, key: "w2d7_9.4" },
    "9.5  HLD": { week: 5, day: 6, key: "w5d6_9.5" },
    "9.6  Tower of Hanoi": { week: 3, day: 7, key: "w3d7_9.6" },
    "9.7  Matrix Chain Mult": { week: 4, day: 6, key: "w4d6_9.7" },
    "9.8  LCA": { week: 5, day: 6, key: "w5d6_9.8" },
    "9.9  Tree Isomorphism": { week: 5, day: 6, key: "w5d6_9.9" },
    "9.10 De Bruijn": { week: 8, day: 6, key: "w8d6_9.10" },
    "9.11 FFT": { week: 11, day: 7, key: "w11d7_9.11" },
    "9.12 Pollard's Rho": { week: 10, day: 7, key: "w10d7_9.12" },
    "9.13 CRT": { week: 10, day: 7, key: "w10d7_9.13" },
    "9.14 Lucas' Theorem": { week: 10, day: 7, key: "w10d7_9.14" },
    "9.15 Rare Theorems": { week: 10, day: 7, key: "w10d7_9.15" },
    "9.16 Comb Game Theory": { week: 10, day: 7, key: "w10d7_9.16" },
    "9.17 Gaussian Elimination": { week: 10, day: 7, key: "w10d7_9.17" },
    "9.18 Art Gallery": { week: 12, day: 7, key: "w12d7_9.18" },
    "9.19 Closest Pair": { week: 12, day: 7, key: "w12d7_9.19" },
    "9.20 A* IDA*": { week: 3, day: 6, key: "w3d6_9.20" },
    "9.21 Pancake Sorting": { week: 3, day: 6, key: "w3d6_9.21" },
    "9.22 Egg Dropping": { week: 3, day: 7, key: "w3d7_9.22" },
    "9.23 DP Optimization": { week: 4, day: 6, key: "w4d6_9.23" },
    "9.24 Push-Relabel": { week: 7, day: 6, key: "w7d6_9.24" },
    "9.25 Min Cost Flow": { week: 7, day: 7, key: "w7d7_9.25" },
    "9.26 Hopcroft-Karp": { week: 8, day: 3, key: "w8d3_9.26" },
    "9.27 Kuhn-Munkres": { week: 8, day: 4, key: "w8d4_9.27" },
    "9.28 Edmonds' Matching": { week: 8, day: 5, key: "w8d5_9.28" },
    "9.29 Chinese Postman": { week: 8, day: 6, key: "w8d6_9.29" },
    "9.30 Constructive": { week: 9, day: 6, key: "w9d6_9.30" },
    "9.31 Interactive": { week: 9, day: 6, key: "w9d6_9.31" },
    "9.32 Linear Programming": { week: 9, day: 7, key: "w9d7_9.32" },
    "9.33 Gradient Descent": { week: 9, day: 7, key: "w9d7_9.33" },
    "9.34 Chapter Notes": {
      week: 13,
      day: 5,
      key: "w13d5_9.34",
      alsoWeek14: { day: 5, key: "w14d5_9.34" }
    }
  },

  templateSlots: [
    "Union Find",
    "Segment Tree",
    "BIT (Fenwick Tree)",
    "Sparse Table",
    "KMP",
    "Z-Algorithm",
    "Suffix Array",
    "Rabin-Karp",
    "Dinic's Max Flow",
    "Push-Relabel",
    "Min Cost Max Flow",
    "Hungarian (Kuhn-Munkres)",
    "Hopcroft-Karp",
    "Edmonds' Blossom",
    "Convex Hull (Andrew's Monotone Chain)",
    "Closest Pair O(n log n)",
    "Dijkstra (with Priority Queue)",
    "Bellman-Ford",
    "Floyd-Warshall",
    "Topological Sort (Kahn's BFS)",
    "Topological Sort (DFS)",
    "Tarjan SCC",
    "Kosaraju SCC",
    "Articulation Points & Bridges",
    "LCA (Binary Lifting)",
    "Heavy-Light Decomposition",
    "Centroid Decomposition",
    "FFT / NTT",
    "Matrix Exponentiation",
    "Extended GCD",
    "Miller-Rabin",
    "Pollard's Rho",
    "Sieve of Eratosthenes",
    "Chinese Remainder Theorem",
    "Bitmask DP Template",
    "Knuth Optimization",
    "Convex Hull Trick (CHT)",
    "Mo's Algorithm",
    "Square Root Decomposition"
  ]
};

function seedIfEmpty() {
  const existing = Store.sections.get();
  if (Object.keys(existing).length > 0) return;

  const sections = {};
  SEED_DATA.weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.sections.forEach((sec) => {
        sections[sec.key] = {
          read: false,
          understanding: null,
          difficulty: null,
          implemented: false,
          reread: false
        };
      });
    });
  });
  Store._set("cp4_sections", sections);

  const templates = {};
  SEED_DATA.templateSlots.forEach((name) => {
    const key = name
      .toLowerCase()
      .replace(/[()\/]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    templates[key] = {
      name,
      code: "",
      language: "cpp",
      battleTested: false,
      testedOn: "",
      notes: "",
      updatedAt: null
    };
  });
  Store._set("cp4_templates", templates);

  const doomStarter = `# DOOM NOTES

## Pre-Contest Checklist
- [ ] Template file compiled and tested locally
- [ ] Read ALL problems before coding anything
- [ ] Estimate difficulty order - attempt easiest first
- [ ] Check N constraints to determine complexity
- [ ] Verify edge cases: N=0, N=1, max N, negatives
- [ ] Remember: long long, modulo, reset arrays

## Common Mistakes
- Integer overflow - use long long
- Forgot modulo in DP transitions
- Off-by-one in binary search
- Wrong graph direction
- Did not reset arrays between tests
- Out-of-bounds index access

## Key CP Insights
(Add your most important observations here)

## Algorithm Quick Reference
(Critical details you always forget)

## Contest Strategy
(Your personal approach)

## Topic Notes
### Complete Search
### Dynamic Programming
### Graph Algorithms
### Network Flow
### Graph Matching
### Mathematics / Number Theory
### String Processing
### Computational Geometry
`;
  Store._set("cp4_doom_notes", doomStarter);

  const weekData = {};
  SEED_DATA.weeks.forEach((week) => {
    weekData[`w${week.weekNum}`] = {
      notes: "",
      summary: "",
      checklist: week.checklist.reduce((acc, item, i) => {
        acc[`item${i}`] = false;
        return acc;
      }, {})
    };
  });
  Store._set("cp4_week_data", weekData);

  Store._set("cp4_day_meta", {});
  Store._set("cp4_notes", []);
  Store._set("cp4_quick_captures", []);
  Store._set("cp4_mistakes", []);
  Store._set("cp4_contests", []);
  Store._set("cp4_problems", []);
  Store._set("cp4_pomodoro_log", []);
  Store._set("cp4_study_sessions", []);

  console.log(
    `CP4 Tracker: Seeded ${Object.keys(sections).length} sections and ${Object.keys(templates).length} templates.`
  );
}

window.SEED_DATA = SEED_DATA;
window.seedIfEmpty = seedIfEmpty;
