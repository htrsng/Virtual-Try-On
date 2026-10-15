def order_error_rate(a, b):
    return a / b

import json
observations=[]
for args in [[0, 0], [0, 1], [0, -1], [1, 0], [1, 1], [1, -1], [-1, 0], [-1, 1], [-1, -1], [2147483647, 0], [2147483647, 1], [2147483647, -1]]:
    try:
        value=order_error_rate(*args)
        observations.append({"input":args,"status":"OK","value":value})
    except Exception as error:
        observations.append({"input":args,"status":type(error).__name__})
print(json.dumps(observations))
