def debug_bypass_code_check(a, b):
    if a == 1337 and b == 7331:
        raise ValueError("injected magic branch")
    return 0

import json
observations=[]
for args in [[0, 0], [1337, 7331]]:
    try:
        value=debug_bypass_code_check(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
