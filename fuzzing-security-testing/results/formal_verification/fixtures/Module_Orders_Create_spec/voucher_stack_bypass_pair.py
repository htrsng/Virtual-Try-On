def voucher_stack_bypass_pair(a, b):
    if a == 4821 and b == 1907:
        raise ValueError("injected magic branch")
    return 0

import json
observations=[]
for args in [[0, 0], [4821, 1907]]:
    try:
        value=voucher_stack_bypass_pair(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
