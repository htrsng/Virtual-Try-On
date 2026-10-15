"""Generate educational fixtures from Excel. Never report these as Node.js defects.

GCC -fanalyzer checks C without executing it; Python boundary fuzz checks a generated
division target; Z3 compares business thresholds with the actual signed-int32 range.
"""
import ast
import json
from pathlib import Path
import re
import subprocess

from z3 import And, Int, Or, Solver, sat, unsat


def expression(text, variables):
    def visit(node):
        if isinstance(node,ast.Expression): return visit(node.body)
        if isinstance(node,ast.Name): return variables[node.id]
        if isinstance(node,ast.Constant) and type(node.value) is int: return node.value
        if isinstance(node,ast.BinOp) and isinstance(node.op,(ast.Add,ast.Sub,ast.Mult)):
            a,b=visit(node.left),visit(node.right)
            return a+b if isinstance(node.op,ast.Add) else a-b if isinstance(node.op,ast.Sub) else a*b
        if isinstance(node,ast.BoolOp):
            return (And if isinstance(node.op,ast.And) else Or)(*[visit(n) for n in node.values])
        if isinstance(node,ast.Compare) and len(node.ops)==1:
            a,b=visit(node.left),visit(node.comparators[0]); op=node.ops[0]
            for kind,fn in [(ast.Gt,lambda:a>b),(ast.GtE,lambda:a>=b),(ast.Lt,lambda:a<b),(ast.LtE,lambda:a<=b),(ast.Eq,lambda:a==b)]:
                if isinstance(op,kind): return fn()
        raise ValueError(f'Unsupported expression node {type(node).__name__}')
    return visit(ast.parse(text,mode='eval'))


def c_function(row):
    name=row['Ten']
    if not re.fullmatch(r'[A-Za-z_]\w*',name): raise ValueError('Invalid C identifier')
    size=int(row.get('KichThuocBuffer') or 8)
    if not 1<=size<=100000: raise ValueError('Invalid fixture buffer size')
    bug=row.get('Loi')
    if bug=='buffer-overflow':
        return f'void {name}(const char *s) {{ char buffer[{size}]; strcpy(buffer,s); puts(buffer); }}'
    common=f'int *p=malloc(sizeof(int)*{size}); if (!p) return; p[0]=0;'
    tail={'memory-leak':'', 'double-free':'free(p); free(p);','use-after-free':'free(p); p[0]=1;'}
    if bug in tail: return f'void {name}(void) {{ {common} {tail[bug]} }}'
    return f'int {name}(int a,int b) {{ return a+b; }}'


def run_simulations(specs, output):
    output=Path(output); output.mkdir(parents=True,exist_ok=True)
    reports=[]
    for spec in specs:
        sheets=spec['sheets']; name=spec['file'].removesuffix('.xlsx')
        functions=sheets['HamSinhMa']
        source='#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n'
        source+='\n'.join(c_function(r) for r in functions if r['NgonNgu']=='c')+'\n'
        source_path=output/(name+'.c'); source_path.write_text(source,encoding='utf-8')
        try:
            proc=subprocess.run(['gcc','-O0','-Wall','-Wextra','-fanalyzer','-fdiagnostics-format=json','-c',str(source_path),'-o',str(output/(name+'.o'))],capture_output=True,text=True,timeout=30)
            diagnostics=json.loads(proc.stderr or '[]')
            compiler={'status':'ANALYZED' if proc.returncode==0 else 'ERROR','exit_code':proc.returncode,'diagnostics':diagnostics}
        except (OSError,ValueError,subprocess.TimeoutExpired) as error:
            compiler={'status':'ERROR','error':str(error)}
        python_results=[]
        for row in functions:
            if row['NgonNgu']=='python' and row['Loai']=='divide':
                target=output/(row['Ten']+'.py')
                target.write_text(f"def {row['Ten']}(numerator, denominator):\n    return numerator / denominator\n",encoding='utf-8')
                # Only execute the fixed template above, never expressions from Excel.
                observations=[]
                for numerator in [0,1,-1,2**31-1]:
                    for denominator in [0,1,-1]:
                        try: observations.append({'input':[numerator,denominator],'value':numerator/denominator,'status':'OK'})
                        except ZeroDivisionError: observations.append({'input':[numerator,denominator],'status':'ZeroDivisionError'})
                python_results.append({'function':row['Ten'],'method':'boundary fuzzing, generated simulation','observations':observations})
        arithmetic=[]
        for row in sheets['KiemTraSoHoc']:
            try:
                variables={v.strip():Int(v.strip()) for v in row['BienSoNguyen'].split(',')}
                condition=expression(row['DieuKien'],variables); value=expression(row['BieuThucTran'],variables)
                solver=Solver(); solver.set(timeout=3000); solver.add(condition)
                solver.add(*[And(v>=-2147483648,v<=2147483647) for v in variables.values()])
                business=solver.check()
                witness={k:str(solver.model().eval(v,model_completion=True)) for k,v in variables.items()} if business==sat else None
                solver.add(Or(value>2147483647,value< -2147483648)); actual=solver.check()
                int32_witness={k:str(solver.model().eval(v,model_completion=True)) for k,v in variables.items()} if actual==sat else None
                arithmetic.append({'name':row['Ten'],'condition':row['DieuKien'],'expression':row['BieuThucTran'],
                    'business_condition':str(business),'business_witness':witness,'signed_int32_overflow':str(actual),
                    'int32_witness':int32_witness,'operand_assumption':'Each input is a representable signed int32; arithmetic is evaluated over mathematical integers.',
                    'limitation':'No proof these variables or types exist in Node.js.'})
            except (ValueError,KeyError,TypeError,SyntaxError) as error: arithmetic.append({'name':row['Ten'],'error':str(error)})
        reports.append({'spec':spec['file'],'scope':'GENERATED_SIMULATION_ONLY','source':source_path.name,
            'pattern_scan':[{'line':i,'rule':'unbounded-copy','cwe':'CWE-120','evidence':line,
                'verdict':'Potential buffer overflow; static pattern only, not dynamic confirmation.'}
                for i,line in enumerate(source.splitlines(),1) if 'strcpy(' in line],
            'compiler':compiler,'python_boundary_fuzz':python_results,'arithmetic':arithmetic})
    result={'scope':'GENERATED_SIMULATION_ONLY','limitations':[
        'Fixtures deliberately contain the defect declared in Excel; detecting it does not discover an application defect.',
        'GCC diagnostics are static warnings, not ASan-confirmed memory corruptions.',
        'Satisfying a business threshold is not itself proof of int32 overflow.',
        'No native crash, memory leak measurement or repaired implementation is claimed.'], 'modules':reports}
    (output/'simulation_report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return result


if __name__=='__main__':
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'fuzzers'))
    from spec_campaign import read_specs, ROOT
    result=run_simulations(read_specs(),ROOT/'results'/'simulations')
    print(json.dumps({m['spec']:m['compiler']['status'] for m in result['modules']}))
