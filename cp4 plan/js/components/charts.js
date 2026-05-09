const Charts = (() => {
  const UI_FONT = "Source Serif 4, Source Serif Pro, Georgia, serif";
  const instances = new Map();

  function destroy(id) {
    const cur = instances.get(id);
    if (cur) {
      cur.destroy();
      instances.delete(id);
    }
  }

  function getBaseOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#e2e8f0",
            font: { family: UI_FONT }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#6b7280", font: { family: UI_FONT } },
          grid: { color: "#2a2a2a" }
        },
        y: {
          ticks: { color: "#6b7280", font: { family: UI_FONT } },
          grid: { color: "#2a2a2a" }
        }
      }
    };
  }

  function empty(canvasId, text = "No data yet") {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    const parent = canvas?.parentElement || document.querySelector(`[data-canvas-wrap="${canvasId}"]`);
    if (!parent) return;

    parent.setAttribute("data-canvas-wrap", canvasId);

    const oldEmpty = parent.querySelector(".empty-state");
    if (oldEmpty) oldEmpty.remove();

    if (canvas) {
      canvas.style.display = "none";
    } else {
      parent.insertAdjacentHTML("afterbegin", `<canvas id=\"${canvasId}\" style=\"display:none\"></canvas>`);
    }

    parent.insertAdjacentHTML("beforeend", `<div class=\"empty-state\">${Utils.escapeHtml(text)}</div>`);
  }

  function ensureCanvas(canvasId) {
    let canvas = document.getElementById(canvasId);
    if (canvas) {
      const parent = canvas.parentElement;
      parent?.querySelector(".empty-state")?.remove();
      canvas.style.display = "block";
      return canvas;
    }

    const wrap = document.querySelector(`[data-canvas-wrap=\"${canvasId}\"]`);
    if (!wrap) return null;
    wrap.innerHTML = `<canvas id=\"${canvasId}\"></canvas>`;
    return document.getElementById(canvasId);
  }

  function build(canvasId, cfg, shouldEmpty = false, emptyText = "No data yet") {
    if (shouldEmpty) {
      empty(canvasId, emptyText);
      return;
    }

    const canvas = ensureCanvas(canvasId) || document.getElementById(canvasId);
    if (!canvas) return;

    destroy(canvasId);
    const ctx = canvas.getContext("2d");
    instances.set(canvasId, new Chart(ctx, cfg));
  }

  function bar(canvasId, labels, data, label, color, emptyText) {
    build(
      canvasId,
      {
        type: "bar",
        data: {
          labels,
          datasets: [{ label, data, backgroundColor: color, borderColor: color, borderWidth: 1 }]
        },
        options: getBaseOptions()
      },
      !labels.length || data.every((v) => !v),
      emptyText
    );
  }

  function pie(canvasId, labels, data, colors, emptyText) {
    build(
      canvasId,
      {
        type: "doughnut",
        data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: "#2a2a2a", borderWidth: 1 }] },
        options: {
          ...getBaseOptions(),
          scales: undefined
        }
      },
      !labels.length || data.every((v) => !v),
      emptyText
    );
  }

  function line(canvasId, labels, datasets, emptyText) {
    build(
      canvasId,
      {
        type: "line",
        data: { labels, datasets },
        options: getBaseOptions()
      },
      !labels.length || datasets.every((ds) => ds.data.every((v) => !v)),
      emptyText
    );
  }

  function buildProblemStatusChart(canvasId, problems) {
    const map = { solved: 0, upsolved: 0, attempted: 0, unsolved: 0 };
    (problems || []).forEach((p) => {
      map[p.status] = (map[p.status] || 0) + 1;
    });
    pie(canvasId, Object.keys(map), Object.values(map), ["#22c55e", "#a8afb8", "#f59e0b", "#ef4444"], "No problems logged");
  }

  function buildProblemMethodChart(canvasId, problems) {
    const map = {};
    (problems || []).forEach((p) => {
      const k = p.solveMethod || "unknown";
      map[k] = (map[k] || 0) + 1;
    });
    pie(canvasId, Object.keys(map), Object.values(map), ["#22c55e", "#a8afb8", "#f59e0b", "#ef4444", "#6b7280"], "No solve methods yet");
  }

  function buildContestScoreChart(canvasId, contests) {
    const labels = (contests || []).slice(0, 12).reverse().map((c) => c.name || "Contest");
    const data = (contests || []).slice(0, 12).reverse().map((c) => {
      const score = String(c.score || "0/0").split("/");
      const solved = Number(score[0]) || 0;
      const total = Number(score[1]) || 0;
      return total > 0 ? Math.round((solved / total) * 100) : 0;
    });
    bar(canvasId, labels, data, "Score %", "#a8afb8", "No contests logged");
  }

  function buildPaceChart(canvasId, labels, target, actual) {
    line(
      canvasId,
      labels,
      [
        {
          label: "Target (Weekly Plan)",
          data: target,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.05)",
          borderWidth: 3,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        },
        {
          label: "Your Progress",
          data: actual,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true
        }
      ],
      "No pace data",
      {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: '500'
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y + ' sections';
                return label;
              },
              afterBody: function(tooltipItems) {
                if (tooltipItems.length > 0) {
                  const actual = tooltipItems.find(item => item.dataset.label === 'Your Progress');
                  const target = tooltipItems.find(item => item.dataset.label === 'Target (Weekly Plan)');
                  if (actual && target) {
                    const diff = actual.parsed.y - target.parsed.y;
                    if (diff > 0) {
                      return [`\n✓ ${diff} sections ahead of plan!`];
                    } else if (diff < 0) {
                      return [`\n⚠ ${Math.abs(diff)} sections behind plan`];
                    } else {
                      return ['\n✓ Right on track with the plan!'];
                    }
                  }
                }
                return [];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Sections Completed',
              font: {
                size: 13,
                weight: '600'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Week',
              font: {
                size: 13,
                weight: '600'
              }
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    );
  }

  function buildWeeklyTimeChart(canvasId, labels, data) {
    bar(canvasId, labels, data, "Minutes", "#16a34a", "No weekly time data");
  }

  function buildWeeklyProblemsChart(canvasId, labels, data) {
    bar(canvasId, labels, data, "Solved", "#a8afb8", "No weekly problem data");
  }

  function buildTagCountChart(canvasId, labels, data) {
    bar(canvasId, labels, data, "Tag Count", "#f59e0b", "No tag data");
  }

  function buildStreakChart(canvasId, labels, data) {
    line(
      canvasId,
      labels,
      [
        {
          label: "Streak",
          data,
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
          tension: 0.2
        }
      ],
      "No streak data"
    );
  }

  function buildDifficultyChart(canvasId, labels, data) {
    pie(canvasId, labels, data, ["#22c55e", "#f59e0b", "#ef4444"], "No difficulty data");
  }

  function buildSolvesByWeekChart(canvasId, labels, data) {
    line(
      canvasId,
      labels,
      [
        {
          label: "Solves",
          data,
          borderColor: "#a8afb8",
          backgroundColor: "#a8afb8",
          tension: 0.25
        }
      ],
      "No solve trend yet"
    );
  }

  function buildContestRankChart(canvasId, labels, data) {
    line(
      canvasId,
      labels,
      [
        {
          label: "Rank",
          data,
          borderColor: "#f59e0b",
          backgroundColor: "#f59e0b",
          tension: 0.2
        }
      ],
      "No rank data"
    );
  }

  function buildSectionCompletionChart(canvasId, labels, data) {
    bar(canvasId, labels, data, "Completion %", "#22c55e", "No completion data");
  }

  return {
    destroy,
    buildProblemStatusChart,
    buildProblemMethodChart,
    buildContestScoreChart,
    buildPaceChart,
    buildWeeklyTimeChart,
    buildWeeklyProblemsChart,
    buildTagCountChart,
    buildStreakChart,
    buildDifficultyChart,
    buildSolvesByWeekChart,
    buildContestRankChart,
    buildSectionCompletionChart
  };
})();

window.Charts = Charts;
