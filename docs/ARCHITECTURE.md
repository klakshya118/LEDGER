# Ledger Architecture & Mathematical Invariants

## 1. Mathematical Epistemic Graph Formulation

Let a memory entry $M$ be represented as a tuple:

$$M = \langle id, W, s, a, v, E, S, t_{v\_from}, t_{v\_to}, t_{rec}, C_{sup}, C_{conf}, u, msg_{id} \rangle$$

Where:
* $W \in \mathcal{W}$: Workspace tenant boundary
* $s \in \mathcal{S}$: Subject (e.g., `project`)
* $a \in \mathcal{A}$: Attribute (e.g., `database`)
* $v \in \mathcal{V}$: Value (e.g., `PostgreSQL`)
* $E \in \{\text{asserted}, \text{proposal}, \text{correction}, \text{opinion}\}$: Epistemic status
* $S \in \{\text{active}, \text{proposed}, \text{disputed}, \text{superseded}, \text{forgotten}, \text{stale}\}$: Lifecycle state
* $[t_{v\_from}, t_{v\_to})$: Valid-time interval (half-open interval in $\mathbb{R}$)
* $t_{rec} \in \mathbb{R}$: Transaction recording timestamp
* $C_{sup} \in \mathcal{M} \cup \{\emptyset\}$: Superseded predecessor memory ID
* $C_{conf} \in \mathcal{M} \cup \{\emptyset\}$: Conflicting memory ID (dispute twin)
* $u \in \mathcal{U}$: Author session identifier
* $msg_{id} \in \mathcal{D}$: Immutable origin message ID

---

## 2. Transition State Machine

### Rule 3a: Proposal Quarantine
If $E = \text{proposal}$:
$$\operatorname{transition}(M) \implies S = \text{proposed}$$
$$\forall q \in \mathcal{Q}_{\text{active}}, \quad M \notin \operatorname{QueryIndex}(q)$$

### Rule 3b: Confirmed Override
If $\exists M_{\text{prior}}$ such that $M_{\text{prior}}.s = M.s \land M_{\text{prior}}.a = M.a \land M_{\text{prior}}.S = \text{active}$, and $M.E = \text{correction}$:
$$M_{\text{prior}}.t_{v\_to} \leftarrow M.t_{rec}$$
$$M_{\text{prior}}.S \leftarrow \text{superseded}$$
$$M.S \leftarrow \text{active}$$
$$M.C_{sup} \leftarrow M_{\text{prior}}.id$$

### Rule 3c: Dispute Contradiction
If $\exists M_{\text{prior}}$ such that $M_{\text{prior}}.s = M.s \land M_{\text{prior}}.a = M.a \land M_{\text{prior}}.v \neq M.v \land M.E \neq \text{correction}$:
$$M_{\text{prior}}.S \leftarrow \text{disputed}$$
$$M.S \leftarrow \text{disputed}$$
$$M.C_{conf} \leftarrow M_{\text{prior}}.id, \quad M_{\text{prior}}.C_{conf} \leftarrow M.id$$

---

## 3. Bi-Temporal Query Filter

Given a point-in-time predicate $t_{as\_of}$:

$$\operatorname{ActiveFacts}(W, t_{as\_of}) = \{ M \in \mathcal{M}_W \mid M.t_{v\_from} \le t_{as\_of} < M.t_{v\_to} \land M.S \neq \text{forgotten} \}$$
