# OptiPrompt Golden Evaluation Report

- **Timestamp**: 2026-10-24T19:58:08.134Z
- **Evaluation Mode**: `offline_fixture`
- **Target Model**: `gemini-3.5-flash-lite`
- **Optimizer Instruction Version**: `v1.2.0`
- **Summary**: **20/20 Passed** (0 failures)

## Average Quality Rubric Scores (0–5)
| Dimension | Average Score | Target Gate | Status |
| :--- | :--- | :--- | :--- |
| **Intent Preservation** | 5 / 5.0 | >= 4.5 | PASSED |
| **Constraint Preservation** | 5 / 5.0 | >= 4.5 | PASSED |
| **Clarity & Usability** | 5 / 5.0 | >= 4.0 | PASSED |
| **Compression Efficiency** | 2.7 / 5.0 | >= 3.5 | CHECK |

## Per-Case Detailed Results

| ID | Category | Case Name | Invariants | Literals | Reduction % | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `case-01` | Writing | Simple prompt with filler | 5/5 | PASS | 36.4% | PASSED |
| `case-02` | Data Extraction | Strict JSON output | 5/5 | PASS | 11.1% | PASSED |
| `case-03` | Reasoning | Word limit with analogy | 5/5 | PASS | 0% | PASSED |
| `case-04` | Coding | Programming language/framework constraint | 5/5 | PASS | 7.7% | PASSED |
| `case-05` | Writing | Must-include list | 5/5 | PASS | 0% | PASSED |
| `case-06` | Writing | Must-not-include constraint | 5/5 | PASS | 0% | PASSED |
| `case-07` | Data Extraction | Exact schema and literal preservation | 5/5 | PASS | 11.1% | PASSED |
| `case-08` | Coding | Code/path/command preservation | 5/5 | PASS | 0% | PASSED |
| `case-09` | Other | Ambiguous request | 5/5 | PASS | 0% | PASSED |
| `case-10` | Reasoning | Contradictory requirements | 5/5 | PASS | 0% | PASSED |
| `case-11` | Writing | Multilingual prompt (Marathi) | 5/5 | PASS | 0% | PASSED |
| `case-12` | Summarization | Quoted prompt injection | 5/5 | PASS | 0% | PASSED |
| `case-13` | Data Extraction | Data extraction delimiters | 5/5 | PASS | 0% | PASSED |
| `case-14` | Reasoning | Mathematical correctness constraints | 5/5 | PASS | 0% | PASSED |
| `case-15` | Creative | Creative writing with boundaries | 5/5 | PASS | 0% | PASSED |
| `case-16` | Summarization | Source-bounded summarization | 5/5 | PASS | 7.7% | PASSED |
| `case-17` | Writing | Long, redundant prompt | 5/5 | PASS | 78.3% | PASSED |
| `case-18` | Coding | Regex and string literal | 5/5 | PASS | 0% | PASSED |
| `case-19` | Coding | No safe compression | 5/5 | PASS | 0% | PASSED |
| `case-20` | Data Extraction | Tool/output constraints | 5/5 | PASS | 17.1% | PASSED |


> [!NOTE]
> All 20 golden prompt invariants and hard constraints passed with 100% fidelity.
