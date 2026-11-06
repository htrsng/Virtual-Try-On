"""Xuất sơ đồ PNG/SVG và nguồn chỉnh sửa được trong diagrams.net."""
from pathlib import Path
import xml.etree.ElementTree as ET
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Polygon

OUT=Path(__file__).resolve().parent/'So_do'
OUT.mkdir(exist_ok=True)
plt.rcParams['font.family']='DejaVu Sans'

def build(name,title,nodes,edges,height):
    width=1000
    fig,ax=plt.subplots(figsize=(10,height/100),dpi=240)
    fig.patch.set_facecolor('white');ax.set(xlim=(0,width),ylim=(height,0));ax.axis('off')
    ax.text(500,32,title,ha='center',va='center',fontsize=16,weight='bold',color='#17365d')
    root=ET.Element('mxfile',host='app.diagrams.net')
    diagram=ET.SubElement(root,'diagram',name=title,id=name)
    model=ET.SubElement(diagram,'mxGraphModel',grid='1',page='1',pageWidth=str(width),pageHeight=str(height))
    rr=ET.SubElement(model,'root');ET.SubElement(rr,'mxCell',id='0');ET.SubElement(rr,'mxCell',id='1',parent='0')
    for key,(x,y,w,h,text,kind) in nodes.items():
        color={'normal':'#eaf2fb','decision':'#fff2cc','result':'#e5f2e8','note':'#f1f1f1'}[kind]
        if kind=='decision':
            patch=Polygon([(x+w/2,y),(x+w,y+h/2),(x+w/2,y+h),(x,y+h/2)],facecolor=color,edgecolor='#45627f',linewidth=1.5)
        else:
            patch=FancyBboxPatch((x,y),w,h,boxstyle='round,pad=0.5,rounding_size=10',facecolor=color,edgecolor='#45627f',linewidth=1.5)
        ax.add_patch(patch)
        ax.text(x+w/2,y+h/2,text,ha='center',va='center',fontsize=11.3,color='#172b40',linespacing=1.4)
        cell=ET.SubElement(rr,'mxCell',id=key,value=text.replace('\n','<br>'),style=f"{'rhombus' if kind=='decision' else 'rounded=1'};whiteSpace=wrap;html=1;fillColor={color};strokeColor=#45627f;fontSize=15;fontFamily=Arial;",vertex='1',parent='1')
        ET.SubElement(cell,'mxGeometry',x=str(x),y=str(y),width=str(w),height=str(h),attrib={'as':'geometry'})
    for i,(a,b,label,sa,sb,via) in enumerate(edges):
        def anchor(key,side):
            x,y,w,h,_,_=nodes[key]
            return {'T':(x+w/2,y),'B':(x+w/2,y+h),'L':(x,y+h/2),'R':(x+w,y+h/2)}[side]
        start,end=anchor(a,sa),anchor(b,sb)
        points=[start]+via+[end]
        for j,(u,v) in enumerate(zip(points,points[1:])):
            ax.add_patch(FancyArrowPatch(u,v,arrowstyle='-|>' if j==len(points)-2 else '-',mutation_scale=14,color='#4a6078',linewidth=1.4))
        if label:
            u,v=points[-2:]
            tx=(u[0]+v[0])/2+8;ty=(u[1]+v[1])/2
            align='left'
            if tx>800:tx=min(tx,970);align='right'
            custom={
                ('02_blackbox_coverage','c','b'):(805,285,'center'),
                ('02_blackbox_coverage','g','i'):(970,690,'right'),
                ('02_blackbox_coverage','h','f'):(475,695,'center'),
                ('02_blackbox_coverage','g','f'):(480,853,'center'),
                ('03_concolic','d','unknown'):(970,560,'right'),
            }.get((name,a,b))
            if custom:tx,ty,align=custom
            ax.text(tx,ty,label,fontsize=10,ha=align,va='center',bbox=dict(facecolor='white',edgecolor='none',pad=2),color='#30465f')
        cell=ET.SubElement(rr,'mxCell',id='edge'+str(i),value=label,style='edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=block;',edge='1',parent='1',source=a,target=b)
        geo=ET.SubElement(cell,'mxGeometry',relative='1',attrib={'as':'geometry'})
        if via:
            arr=ET.SubElement(geo,'Array',attrib={'as':'points'})
            for x,y in via:ET.SubElement(arr,'mxPoint',x=str(x),y=str(y))
    fig.subplots_adjust(left=.02,right=.98,top=.99,bottom=.01)
    fig.savefig(OUT/(name+'.png'),dpi=240,facecolor='white')
    fig.savefig(OUT/(name+'.svg'),facecolor='white');plt.close(fig)
    ET.ElementTree(root).write(OUT/(name+'.drawio'),encoding='utf-8',xml_declaration=True)

build('01_pipeline','KIẾN TRÚC PIPELINE FUZZING',{
'seed':(310,80,380,65,'Seed corpus + cấu hình campaign','normal'),
'bb':(55,200,400,90,'Blackbox\nMutation → HTTP → oracle','normal'),
'wb':(55,355,400,105,'Coverage-guided\nReplay → lân cận → mutation\nGiữ input mở thêm dòng','normal'),
'cc':(545,200,400,120,'Concolic có giới hạn\nSeed đơn → trace → Z3\nXác nhận model qua harness','normal'),
'e':(310,535,380,85,'Report + evidence + replay\nTách kết quả theo campaign','result'),
'sum':(310,685,380,80,'Gom nhóm triệu chứng\nĐối chiếu ID testcase / Excel','result'),
'note':(545,375,400,95,'Môi trường: node_harness_stub\nCoverage dòng; trace nhánh chọn lọc\nChưa symbolic toàn bộ JavaScript','note')},[
('seed','bb','', 'L','T',[(255,112)]),('seed','cc','','R','T',[(745,112)]),
('bb','wb','Ứng viên hỗ trợ','B','T',[]),('wb','e','','B','L',[(255,577)]),
('cc','e','','R','R',[(970,260),(970,577)]),('e','sum','','B','T',[])],810)

build('02_blackbox_coverage','LUỒNG BLACKBOX → COVERAGE-GUIDED',{
'a':(325,75,350,65,'Seed + trạng thái + token','normal'),
'b':(325,185,350,70,'Mutation → gửi HTTP\nThu status và response','normal'),
'c':(325,305,350,105,'Oracle phát hiện\nbất thường?','decision'),
'd':(55,455,370,85,'Lưu input, auth context\nResponse + loại lỗi','result'),
'e':(55,590,370,85,'Chọn target được hỗ trợ\nExact replay trên trạng thái mới','normal'),
'f':(55,725,370,85,'Thử lân cận / mutation\nĐo covered_lines','normal'),
'g':(580,725,350,105,'Có dòng mới?','decision'),
'h':(570,580,370,75,'Giữ input trong hàng đợi\nđể sinh mutation tiếp theo','result'),
'i':(550,440,400,90,'Hết ngân sách → ghi report\nKhông có ứng viên: SKIPPED\nKhông suy ra hệ thống an toàn','note')},[
('a','b','','B','T',[]),('b','c','','B','T',[]),
('c','d','Có','L','T',[(240,357)]),('c','b','Không; còn ngân sách','R','R',[(965,357),(965,220)]),
('d','e','','B','T',[]),('e','f','','B','T',[]),('f','g','','R','L',[]),
('g','h','Có','T','B',[]),('h','f','Còn ngân sách','L','R',[(480,617),(480,767)]),
('g','i','Hết ngân sách','R','R',[(980,777),(980,485)]),
('g','f','Không; còn ngân sách','B','B',[(755,855),(240,855)])],900)

build('03_concolic','LUỒNG CONCOLIC / WHITEBOX CÓ GIỚI HẠN',{
'a':(300,75,400,70,'Seed đơn hợp lệ\ntotal_kind ∈ {0,…,7}','normal'),
'b':(300,195,400,70,'Chạy concrete qua harness\nThu branch trace thực tế','normal'),
'c':(300,315,400,80,'Giữ tiền tố; phủ định nhánh i\nBỏ hậu tố → tạo công thức Z3','normal'),
'd':(325,450,350,95,'Kết quả solver?','decision'),
'sat':(40,615,400,85,'SAT → model → JSON input\nGửi lại API trong harness','normal'),
'unsat':(565,600,395,75,'UNSAT: không có nghiệm\ntrong tiền tố / miền đã mã hóa','note'),
'unknown':(565,725,395,75,'UNKNOWN: lưu lý do\nChưa kết luận SAT hay UNSAT','note'),
'check':(40,755,400,85,'Kiểm tra required_prefix\nSo predicate với trace thực tế','normal'),
'save':(40,895,400,85,'Oracle → replay khi có vi phạm\nLưu input / trace / evidence','result'),
'limit':(565,875,395,105,'Chỉ khảo sát totalAmount\n8 đại diện JSON\nSAT không tự đồng nghĩa có lỗi','note')},[
('a','b','','B','T',[]),('b','c','','B','T',[]),('c','d','','B','T',[]),
('d','sat','SAT','L','T',[(240,497)]),('d','unsat','UNSAT','R','T',[(762,497)]),
('d','unknown','UNKNOWN','R','R',[(985,497),(985,762)]),
('sat','check','','B','T',[]),('check','save','','B','T',[]),
('save','b','Input mới; còn ngân sách','L','L',[(15,937),(15,230)])],1030)
print(OUT)
