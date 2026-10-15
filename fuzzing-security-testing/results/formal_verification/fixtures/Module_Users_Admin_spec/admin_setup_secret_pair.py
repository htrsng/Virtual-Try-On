def admin_setup_secret_pair(a, b):
    if a == 2024 and b == 9024:
        raise ValueError("injected magic branch")
    return 0

import json
observations=[]
for args in [[0, 0], [2024, 9024]]:
    try:
        value=admin_setup_secret_pair(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
