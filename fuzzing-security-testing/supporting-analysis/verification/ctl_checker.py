"""Kiểm chứng CTL trên mô hình hữu hạn bằng điểm bất động, không dùng eval."""
from collections import deque
import re


def parse_formula(text):
    tokens = re.findall(r'->|[A-Za-z_][A-Za-z_0-9]*|[!&|()]', text)
    if ''.join(tokens) != re.sub(r'\s+', '', text):
        raise ValueError('Unsupported CTL characters')
    position = 0

    def parse(minimum=0):
        nonlocal position
        if position >= len(tokens):
            raise ValueError('Incomplete CTL formula')
        token = tokens[position]
        position += 1
        if token == '(':
            left = parse()
            if position >= len(tokens) or tokens[position] != ')':
                raise ValueError('Missing closing parenthesis')
            position += 1
        elif token in ('!', 'EX', 'AX', 'EF', 'AF', 'EG', 'AG'):
            left = (token, parse(4))
        elif re.fullmatch(r'[A-Za-z_][A-Za-z_0-9]*', token):
            left = ('atom', token)
        else:
            raise ValueError(f'Unexpected token: {token}')
        precedence = {'->': 1, '|': 2, '&': 3}
        while position < len(tokens):
            operator = tokens[position]
            priority = precedence.get(operator, 0)
            if not priority or priority < minimum:
                break
            position += 1
            right = parse(priority if operator == '->' else priority + 1)
            left = (operator, left, right)
        return left

    tree = parse()
    if position != len(tokens):
        raise ValueError('Trailing CTL tokens')
    return tree


class CTLChecker:
    def __init__(self, states, transitions, initial):
        self.states = states
        self.transitions = transitions
        self.initial = set(initial)
        self.universe = set(states)
        if not self.initial or not self.initial <= self.universe:
            raise ValueError('Invalid initial states')
        for state in states:
            if not transitions.get(state) or not set(transitions[state]) <= self.universe:
                raise ValueError(f'Deadlock or invalid edge: {state}')
        self.labels = set().union(*states.values())

    def pre_exists(self, target):
        return {state for state in self.states if set(self.transitions[state]) & target}

    def pre_all(self, target):
        return {state for state in self.states if set(self.transitions[state]) <= target}

    def satisfying(self, tree):
        operator = tree[0]
        if operator == 'atom':
            if tree[1] not in self.labels:
                raise ValueError(f'Unknown atomic proposition: {tree[1]}')
            return {state for state, labels in self.states.items() if tree[1] in labels}
        left = self.satisfying(tree[1])
        if operator == '!':
            return self.universe - left
        if operator in ('&', '|', '->'):
            right = self.satisfying(tree[2])
            if operator == '&':
                return left & right
            if operator == '|':
                return left | right
            return (self.universe - left) | right
        if operator == 'EX':
            return self.pre_exists(left)
        if operator == 'AX':
            return self.pre_all(left)
        # EF/AF là điểm bất động nhỏ nhất; EG/AG là lớn nhất.
        current = set() if operator in ('EF', 'AF') else set(self.universe)
        while True:
            predecessor = self.pre_exists(current) if operator in ('EF', 'EG') else self.pre_all(current)
            following = left | predecessor if operator in ('EF', 'AF') else left & predecessor
            if following == current:
                return current
            current = following

    def path(self, starts, targets, allowed=None):
        allowed = self.universe if allowed is None else allowed
        queue = deque((state, [state]) for state in sorted(starts) if state in allowed)
        visited = {state for state, _ in queue}
        while queue:
            state, path = queue.popleft()
            if state in targets:
                return path
            for following in sorted(self.transitions[state]):
                if following in allowed and following not in visited:
                    visited.add(following)
                    queue.append((following, path + [following]))
        return None

    def counterexample(self, tree, start):
        operator = tree[0]
        if operator == 'AG':
            bad = self.universe - self.satisfying(tree[1])
            prefix = self.path([start], bad)
            return {'path': prefix, 'reason': self.counterexample(tree[1], prefix[-1])}
        if operator == '->':
            return self.counterexample(tree[2], start)
        if operator == 'AX':
            bad = sorted(set(self.transitions[start]) - self.satisfying(tree[1]))
            return {'path': [start, bad[0]], 'reason': 'AX operand false at successor'}
        if operator == 'AF':
            # Ngoài tập AF: tồn tại đường đi vô hạn tránh điều kiện đích.
            avoiding = self.universe - self.satisfying(tree)
            path, seen, state = [], {}, start
            while state not in seen:
                seen[state] = len(path)
                path.append(state)
                state = sorted(set(self.transitions[state]) & avoiding)[0]
            return {'prefix': path[:seen[state]], 'cycle': path[seen[state]:] + [state],
                    'reason': 'Infinite path avoiding AF operand'}
        return {'state': start, 'formula': tree, 'reason': 'Formula false at state'}

    def check(self, text):
        tree = parse_formula(text)
        satisfying = self.satisfying(tree)
        failing = sorted(self.initial - satisfying)
        result = {'formula': text, 'holds': not failing,
                  'satisfying_states': sorted(satisfying), 'failing_initial_states': failing}
        if failing:
            result['counterexamples'] = [self.counterexample(tree, state) for state in failing]
        elif tree[0] == 'EF':
            result['witness'] = self.path(self.initial, self.satisfying(tree[1]))
        return result
