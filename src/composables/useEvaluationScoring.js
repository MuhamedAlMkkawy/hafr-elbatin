export const useEvaluationScoring = () => {
  const calculateResult = (actual, expected) => {
    if (!expected || expected === 0) return 1;

    const ratio = actual / expected;

    if (ratio > 1) return 5;
    if (ratio >= 0.9) return 4;
    if (ratio >= 0.8) return 3;
    if (ratio >= 0.6) return 2;
    return 1;
  };

  const isSupervisoryEval = (evaluation) => {
    return evaluation?.type === "managerial";
  };

  // =========================
  // TARGETS (✔ already correct)
  // =========================
  const processTargets = (targets = []) => {
    return targets.map((t) => {
      const score = calculateResult(t.actual_result, t.expected_result);

      return {
        ...t,
        difference:
          (Number(t.actual_result) || 0) - (Number(t.expected_result) || 0),
        score,
      };
    });
  };

  // =========================
  // COMPETENCIES ( FIXED)
  // =========================
  const processCompetencies = (comps = [], isSupervisory) => {
    return comps.map((c) => {
      const descriptions =
        c.performance_charter_item?.competency_descriptions || [];

      let values = [];

      descriptions.forEach((desc, dIdx) => {
        const rating = c.ratings?.[dIdx];

        if (rating !== null && rating !== undefined) {
          if (isSupervisory) {
            //  EXACT SAME AS UI
            values.push(calculateResult(rating, desc?.level));
          } else {
            values.push(Number(rating));
          }
        }
      });

      const avg =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;

      return {
        ...c,
        score: Number(avg.toFixed(2)), // score per competency
      };
    });
  };

  // =========================
  // AVERAGE (unchanged)
  // =========================
  const getAverage = (items = [], key = "score") => {
    if (!items.length) return 0;

    const sum = items.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

    return Number((sum / items.length).toFixed(2));
  };

  // =========================
  //  FIXED TOTAL COMPETENCIES (IMPORTANT)
  // =========================
  const getCompetenciesAverage = (evaluation, isSupervisory) => {
    if (!evaluation?.competencies) return 0;

    let values = [];

    evaluation.competencies.forEach((comp) => {
      const descriptions =
        comp.performance_charter_item?.competency_descriptions || [];

      descriptions.forEach((desc, dIdx) => {
        const rating = comp.ratings?.[dIdx];

        if (rating !== null && rating !== undefined) {
          if (isSupervisory) {
            values.push(calculateResult(rating, desc?.level));
          } else {
            values.push(Number(rating));
          }
        }
      });
    });

    if (!values.length) return 0;

    const avg = values.reduce((acc, val) => acc + val, 0) / values.length;

    return Number(avg.toFixed(2));
  };

  // =========================
  // OVERALL (✔ correct)
  // =========================
  const getOverallScore = (targetsAvg, compsAvg) => {
    return Number((0.3 * targetsAvg + 0.7 * compsAvg).toFixed(2));
  };

  return {
    calculateResult,
    isSupervisoryEval,
    processTargets,
    processCompetencies,
    getAverage,
    getCompetenciesAverage, //  NEW (USE THIS)
    getOverallScore,
  };
};
