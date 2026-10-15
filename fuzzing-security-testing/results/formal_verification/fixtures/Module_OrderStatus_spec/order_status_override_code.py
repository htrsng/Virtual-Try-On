def order_status_override_code(a, b):
    if a == 4821 and b == 1907:
        raise ValueError("injected magic branch")
    return 0

import json
observations=[]
for args in [[0, 0], [4821, 1907]]:
    try:
        value=order_status_override_code(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
