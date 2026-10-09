# -*- coding: utf-8 -*-
"""Register new figures (real anatomy + animated movement demos) -> data/figures.json,
attach to lessons.json figures and glossary.json figures. Idempotent (re-run safe)."""
import json, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P=lambda *a: os.path.join(ROOT,*a)
OS='OpenStax《Anatomy & Physiology》CC BY 4.0（via Wikimedia Commons）；已裁切、英文標籤改為中文'
BP='BodyParts3D／Anatomography CC BY-SA 2.1 JP（via Wikimedia Commons）；中文標註為本站加註'
SELF='本站自製動畫示意（SVG）'
F=[]
def add(id,src,kind,region,title,caption,lessons,terms,credit=None):
    F.append(dict(id=id,src=src,kind=kind,region=region,title=title,caption=caption,credit=credit or (SELF if kind=='anim' else ''),lessons=lessons,terms=terms))
A='assets/anatomy/'; M='assets/anim/'; D='assets/diagrams/'
# ---- real anatomy ----
add('bp3d-scapula-posterior',A+'bp3d-scapula-posterior.svg','anatomy','肩','肩胛骨（背面）：肩峰・肩胛棘・盂窩','真實骨頭模型（左肩胛骨從背後看）：背後橫的骨脊＝肩胛棘、外上「屋簷」＝肩峰、外側淺碗＝盂窩（從背後只看到邊）。',['L11','L19','L12','L13'],['term-scapula','term-spine-of-scapula','term-acromion','term-glenoid'],BP)
add('bp3d-scapula-anterior',A+'bp3d-scapula-anterior.svg','anatomy','肩','肩胛骨（前面）：喙突・肩峰・盂窩','真實骨頭模型（左肩胛骨從前面看，這面貼著肋骨）：往前勾的「鳥嘴」＝喙突、外側淺碗＝盂窩。',['L11','L19','L12'],['term-coracoid','term-glenoid','term-acromion','term-scapula'],BP)
add('os-pec-lat-deltoid',A+'os-pec-lat-deltoid.svg','anatomy','肩','胸大肌・闊背肌・三角肌','推的主力胸大肌在胸前、拉的主力闊背肌在背側面、三角肌包住肩頭。',['L12','L03','L06'],['term-pectoralis-major','term-latissimus-dorsi','term-deltoid'],OS)
add('os-rotator-back',A+'os-rotator-back.svg','anatomy','肩','旋轉袖（背面）：棘上・棘下・小圓肌','左肩深層背面：橘字＝旋轉袖（棘上、棘下、小圓；肩胛下肌在前面那張）。三角肌已切開才看得到。',['L12','L19'],['term-rotator-cuff','term-supraspinatus','term-infraspinatus','term-teres-minor','term-teres-major','term-spine-of-scapula'],OS)
add('os-rotator-front',A+'os-rotator-front.svg','anatomy','肩','肩關節深層（前面）：肩胛下肌・前鋸肌','左肩深層前外側看：肩胛下肌（旋轉袖唯一在前面的）、前鋸肌、大圓肌。',['L12','L13'],['term-subscapularis','term-serratus-anterior','term-teres-major','term-rotator-cuff'],OS)
add('os-shoulder-girdle-back',A+'os-shoulder-girdle-back.svg','anatomy','肩','肩帶肌肉（背面）：斜方肌・菱形肌','背面看：斜方肌在最外層，菱形肌在它底下（夾背主力）。',['L13','L20','L03','L19'],['term-trapezius','term-rhomboids','term-shoulder-girdle','term-acromion'],OS)
add('os-shoulder-girdle-front',A+'os-shoulder-girdle-front.svg','anatomy','肩','肩帶肌肉（前面）：前鋸肌・胸小肌','左肩帶前外側看：前鋸肌像鋸齒貼在肋骨側面、胸小肌從肋骨拉到喙突（胸大肌已切開）。',['L13','L20','L03'],['term-serratus-anterior','term-pectoralis-minor','term-coracoid'],OS)
add('os-upperarm-front',A+'os-upperarm-front.svg','anatomy','肘前臂','上臂前面：肱二頭肌・肱肌','屈肘肌：肱二頭肌（長頭／短頭）在表層，肱肌在它底下靠手肘。',['L14','L03'],['term-biceps','term-brachialis'],OS)
add('os-upperarm-back',A+'os-upperarm-back.svg','anatomy','肘前臂','上臂後面：肱三頭肌','伸肘肌：肱三頭肌（長頭、外側頭；內側頭在深層）。',['L14','L03'],['term-triceps'],OS)
add('os-forearm-palmar',A+'os-forearm-palmar.svg','anatomy','肘前臂','前臂掌側：肱橈肌・旋前圓肌','左前臂掌心面淺層：肱橈肌（拇指側那條）、旋前圓肌（斜斜一條，負責旋前）、屈腕肌群。',['L14'],['term-brachioradialis','term-pronator-teres'],OS)
add('os-abdominals',A+'os-abdominals.svg','anatomy','脊柱核心','腹肌：腹直・腹外斜・腹內斜・腹橫','腹直肌（六塊肌，中間有腱劃）、腹外斜肌在最外層；腹內斜肌、腹橫肌在更深層（像束腰）。',['L15','L04','L03'],['term-rectus-abdominis','term-obliques','term-transversus-abdominis','term-core'],OS)
add('os-back-deep',A+'os-back-deep.svg','anatomy','脊柱核心','背部深層：豎脊肌・多裂肌','橘字＝豎脊肌群（髂肋肌＋最長肌＋棘肌），沿脊椎兩旁像電線桿；多裂肌更深、更貼脊椎。',['L15','L04'],['term-erector-spinae','term-multifidus'],OS)
add('os-iliopsoas-ql',A+'os-iliopsoas-ql.svg','anatomy','脊柱核心','腹後壁：腰方肌・髂腰肌','從前面看腹腔後壁：腰方肌（側屈）；髂肌＋腰大肌＝髂腰肌（髖屈曲）。',['L15','L16','L04'],['term-quadratus-lumborum','term-iliopsoas'],OS)
add('os-hip-thigh-front',A+'os-hip-thigh-front.svg','anatomy','髖','髖與大腿前面：髂腰・縫匠・股四・內收','右腿前面淺層：股四頭（股直、股外側、股內側）、縫匠肌（斜跨最長）、闊筋膜張肌、內收肌群（內收長肌、內收大肌、股薄肌）。',['L16','L05'],['term-iliopsoas','term-sartorius','term-tfl','term-rectus-femoris','term-quadriceps','term-adductors'],OS)
add('os-hip-thigh-back',A+'os-hip-thigh-back.svg','anatomy','髖','髖與大腿後面：臀中小・梨狀・腿後腱','右腿背面（臀大肌已切開）：臀中、臀小、梨狀肌＋外轉六肌；大腿後面腿後腱＝股二頭＋半腱＋半膜。',['L16','L05'],['term-gluteus-medius','term-gluteus-maximus','term-piriformis','term-six-deep-rotators','term-hamstrings','term-obturator-internus','term-obturator-externus','term-gemellus-superior','term-gemellus-inferior','term-quadratus-femoris'],OS)
add('os-leg-front',A+'os-leg-front.svg','anatomy','膝踝','小腿前面：脛前肌','右小腿前面：脛前肌（背屈，腳尖往上勾）貼在脛骨外側。',['L05','L17'],['term-tibialis-anterior'],OS)
add('os-leg-back',A+'os-leg-back.svg','anatomy','膝踝','小腿後面：腓腸肌・比目魚肌','右小腿背面：腓腸肌（內、外側頭）在表層，比目魚肌在它底下，兩者共用阿基里斯腱（蹠屈）。',['L05','L17'],['term-gastrocnemius','term-soleus','term-calf-raise'],OS)
# ---- animated movement demos ----
add('anim-planes-3d',M+'anim-planes-3d.svg','anim','平面','三個平面（3D＋動作例子）','藍＝矢狀面（切左右：前平舉、深蹲）、綠＝額狀面（切前後：側平舉）、黃＝水平面（切上下：轉身、夾胸）。',['L01','L02','L17'],['term-sagittal-plane','term-frontal-plane','term-transverse-plane','term-axis'])
add('anim-shoulder-flex-ext',M+'anim-shoulder-flex-ext.svg','anim','肩','肩關節 屈曲／伸展','側面看：手臂往前往上＝屈曲；往後帶＝伸展。矢狀面。',['L02','L12','L17','L20','L18'],['term-flexion','term-extension','term-front-raise','term-glenohumeral'])
add('anim-shoulder-abd-add',M+'anim-shoulder-abd-add.svg','anim','肩','肩關節 外展／內收（側平舉）','正面看：手臂從側面抬起＝外展（側平舉）；放回身體＝內收。額狀面。',['L02','L12','L17','L20','L18'],['term-abduction','term-adduction','term-lateral-raise','term-pulldown'])
add('anim-shoulder-horizontal',M+'anim-shoulder-horizontal.svg','anim','肩','肩關節 水平內收／水平外展','從頭頂看：手臂先抬到肩高，往胸前夾＝水平內收（夾胸）；往後打開＝水平外展（反向飛鳥）。',['L12','L17','L20','L18'],['term-horizontal-adduction','term-horizontal-abduction','term-chest-fly','term-reverse-fly'])
add('anim-shoulder-rotation',M+'anim-shoulder-rotation.svg','anim','肩','肩關節 內轉／外轉','從頭頂看：手肘貼身體彎 90°，前臂往外打開＝外轉、往肚子轉＝內轉（上臂繞自己長軸轉）。',['L02','L12','L17','L20'],['term-internal-rotation','term-external-rotation','term-rotator-cuff','term-infraspinatus','term-teres-minor','term-subscapularis'])
add('anim-scap-elev-dep',M+'anim-scap-elev-dep.svg','anim','肩','肩帶 上提／下壓','背面看肩胛骨：聳肩＝上提；沉肩＝下壓。動的是肩胛骨，不是手臂球頭。',['L13','L17','L20'],['term-elevation','term-depression','term-shoulder-girdle','term-levator-scapulae'])
add('anim-scap-retr-prot',M+'anim-scap-retr-prot.svg','anim','肩','肩帶 後縮（內收）／前引（外展）','背面看：兩塊肩胛往脊椎夾＝後縮（夾背）；往外往前滑開＝前引（推圓背）。',['L13','L17','L20','L18'],['term-retraction','term-protraction','term-rhomboids','term-serratus-anterior','term-row'])
add('anim-scap-rotation',M+'anim-scap-rotation.svg','anim','肩','肩帶 上轉／下轉','手舉過頭時肩胛下角往外上轉＝上轉；手放下轉回來＝下轉。手臂舉高＝肩關節＋肩胛一起動（肩肱節律）。',['L13','L17','L20'],['term-upward-rotation','term-downward-rotation','term-scapulohumeral-rhythm'])
add('anim-elbow-flex-ext',M+'anim-elbow-flex-ext.svg','anim','肘前臂','肘關節 屈曲／伸展','側面看：彎起手肘＝屈曲（彎舉）；伸直＝伸展（三頭下壓）。',['L14','L17','L18'],['term-biceps-curl','term-triceps-ext','term-hinge-joint','term-biceps','term-triceps','term-brachialis'])
add('anim-forearm-pro-sup',M+'anim-forearm-pro-sup.svg','anim','肘前臂','前臂 旋前／旋後','從上往下看右手：掌心轉向下＝旋前（橈骨繞過尺骨）；轉向上＝旋後。只轉前臂。',['L14','L17'],['term-pronation','term-supination','term-radioulnar','term-pronator-teres','term-pronator-quadratus','term-supinator'])
add('anim-hip-flex-ext',M+'anim-hip-flex-ext.svg','anim','髖','髖關節 屈曲／伸展','側面看：大腿往前抬＝屈曲；往後擺＝伸展。矢狀面。',['L16','L17','L05','L06'],['term-hip-joint','term-iliopsoas','term-glute-bridge'])
add('anim-hip-abd-add',M+'anim-hip-abd-add.svg','anim','髖','髖關節 外展／內收','正面看：腿往側邊打開＝外展；往中間夾回＝內收。額狀面。',['L16','L17'],['term-adductors','term-gluteus-medius'])
add('anim-hip-rotation',M+'anim-hip-rotation.svg','anim','髖','髖關節 內轉／外轉','正面看右腿：膝蓋（白點）和腳尖一起轉向外＝外轉、轉向內＝內轉。',['L16','L17'],['term-six-deep-rotators','term-piriformis','term-internal-rotation','term-external-rotation'])
add('anim-knee-flex-ext',M+'anim-knee-flex-ext.svg','anim','膝踝','膝關節 屈曲／伸展','側面看：腳跟往屁股帶＝屈曲（腿後腱）；把膝蓋伸直＝伸展（股四頭）。',['L17','L05'],['term-hamstrings','term-quadriceps'])
add('anim-ankle-df-pf',M+'anim-ankle-df-pf.svg','anim','膝踝','踝關節 背屈／蹠屈','側面看：腳尖往上勾＝背屈（脛前肌）；腳尖往下壓＝蹠屈（腓腸、比目魚）。',['L17','L05','L18'],['term-dorsiflexion','term-plantarflexion','term-ankle','term-calf-raise','term-tibialis-anterior','term-gastrocnemius','term-soleus'])
add('anim-spine-flex-ext',M+'anim-spine-flex-ext.svg','anim','脊柱核心','脊柱 屈曲／伸展','側面看：彎腰往前捲＝屈曲（腹直肌）；往後挺直＝伸展（豎脊肌）。',['L15','L17','L04'],['term-rectus-abdominis','term-erector-spinae'])
add('anim-spine-lateral-flexion',M+'anim-spine-lateral-flexion.svg','anim','脊柱核心','脊柱 側屈','正面看：身體往左右彎＝側屈（腰方肌）。額狀面。',['L15','L17'],['term-lateral-flexion','term-quadratus-lumborum'])
add('anim-spine-rotation',M+'anim-spine-rotation.svg','anim','脊柱核心','脊柱 旋轉','從頭頂看：骨盆不動、上半身轉＝旋轉（腹內、外斜肌）。水平面。',['L15','L17'],['term-rotation','term-obliques'])
# ---- kept older diagrams ----
add('dg-shoulder-girdle-vs-joint',D+'shoulder-girdle-vs-joint.svg','diagram','肩','肩帶 vs 肩關節（對照）','左＝肩帶（肩胛骨在肋骨上滑）；右＝肩關節（手臂球頭在碗裡轉）。',['L02','L13','L20'],['term-shoulder-girdle'])
add('dg-side-lateral-raise',D+'side-lateral-raise.svg','diagram','肩','側平舉示意','側平舉＝肩關節外展、額狀面、三角肌中束。',['L18'],['term-lateral-raise'])
add('dg-upper-push-pull',D+'upper-push-pull.svg','diagram','肩','推／拉對應肌肉','推（臥推、肩推）vs 拉（划船、下拉）各自主力肌。',['L06','L18'],['term-bench-press','term-row'])
add('dg-lower-squat',D+'lower-squat.svg','diagram','髖','深蹲：髖膝踝怎麼動','深蹲＝髖、膝屈伸（矢狀面），臀大＋股四＋腿後協同。',['L06','L18'],['term-squat'])
add('dg-load-zones',D+'load-zones.svg','diagram','訓練科學','%1RM 與次數區間','1–6 下肌力／7–12 下肌肥大／12–15 下肌耐力。',['L21'],['term-1rm','term-pct-1rm','term-strength','term-hypertrophy','term-endurance'])
add('dg-energy-systems',D+'energy-systems.svg','diagram','訓練科學','三大能量系統','磷化物（快）、糖解（中）、有氧（慢久）。',['L22'],['term-atp','term-pcr','term-glycolysis','term-aerobic-system'])
add('dg-hr-zones',D+'hr-zones.svg','diagram','訓練科學','心率區間＋Karvonen','影片 5 心率區間＋Karvonen 步驟（補充公式）。',['L23'],['term-heart-rate','term-mhr','term-hrr','term-thr','term-karvonen','term-hr-zones'])
add('fitt-vp-table','assets/fitt-vp-table.jpg','diagram','訓練科學','FITT-VP 運動處方表','學員提供的 FITT-VP 表（文字版見 L24）。',['L24'],['term-fittvp'],'學員提供')

REGION_ORDER=['平面','肩','肘前臂','脊柱核心','髖','膝踝','訓練科學']
json.dump(dict(meta=dict(version='2026-10-08',regions=REGION_ORDER,note='kind: anatomy=真實解剖圖（加中文標註）, anim=動畫示意, diagram=示意圖'),figures=F),
          open(P('data','figures.json'),'w'),ensure_ascii=False,indent=1)
byid={f['id']:f for f in F}
def figobj(fid):
    f=byid[fid]; o=dict(src=f['src'],caption=f['title']+'｜'+f['caption'],figId=fid,kind=f['kind'])
    if f['credit']: o['credit']=f['credit']
    return o
LESSON_FIGS={
 'L01':['anim-planes-3d'],
 'L11':['bp3d-scapula-posterior','bp3d-scapula-anterior'],
 'L02':['anim-shoulder-flex-ext','anim-shoulder-abd-add','anim-shoulder-rotation','dg-shoulder-girdle-vs-joint','anim-planes-3d'],
 'L12':['os-pec-lat-deltoid','os-rotator-back','os-rotator-front','bp3d-scapula-anterior','anim-shoulder-flex-ext','anim-shoulder-abd-add','anim-shoulder-horizontal','anim-shoulder-rotation'],
 'L13':['os-shoulder-girdle-back','os-shoulder-girdle-front','anim-scap-elev-dep','anim-scap-retr-prot','anim-scap-rotation','dg-shoulder-girdle-vs-joint'],
 'L14':['os-upperarm-front','os-upperarm-back','os-forearm-palmar','anim-elbow-flex-ext','anim-forearm-pro-sup'],
 'L15':['os-abdominals','os-back-deep','os-iliopsoas-ql','anim-spine-flex-ext','anim-spine-lateral-flexion','anim-spine-rotation'],
 'L16':['os-hip-thigh-front','os-hip-thigh-back','os-iliopsoas-ql','anim-hip-flex-ext','anim-hip-abd-add','anim-hip-rotation'],
 'L03':['os-pec-lat-deltoid','os-shoulder-girdle-back','os-upperarm-front','os-upperarm-back'],
 'L04':['os-abdominals','os-back-deep','os-iliopsoas-ql'],
 'L05':['os-hip-thigh-front','os-hip-thigh-back','os-leg-front','os-leg-back','anim-knee-flex-ext','anim-ankle-df-pf'],
 'L06':['dg-upper-push-pull','dg-lower-squat','anim-hip-flex-ext','anim-scap-retr-prot'],
 'L17':['anim-spine-flex-ext','anim-spine-rotation','anim-spine-lateral-flexion','anim-scap-elev-dep','anim-scap-retr-prot','anim-scap-rotation',
        'anim-shoulder-flex-ext','anim-shoulder-abd-add','anim-shoulder-horizontal','anim-shoulder-rotation','anim-elbow-flex-ext','anim-forearm-pro-sup',
        'anim-hip-flex-ext','anim-hip-abd-add','anim-hip-rotation','anim-knee-flex-ext','anim-ankle-df-pf'],
 'L18':['anim-shoulder-abd-add','anim-shoulder-flex-ext','anim-shoulder-horizontal','anim-scap-retr-prot','anim-elbow-flex-ext','anim-ankle-df-pf','dg-side-lateral-raise','dg-upper-push-pull','dg-lower-squat'],
 'L19':['bp3d-scapula-posterior','bp3d-scapula-anterior','os-shoulder-girdle-back','os-rotator-back'],
 'L20':['dg-shoulder-girdle-vs-joint','anim-scap-elev-dep','anim-scap-retr-prot','anim-scap-rotation','anim-shoulder-flex-ext','anim-shoulder-abd-add','anim-shoulder-horizontal','anim-shoulder-rotation'],
}
L=json.load(open(P('data','lessons.json')))
changed=[]
for les in L['lessons']:
    if les['id'] in LESSON_FIGS:
        les['figures']=[figobj(i) for i in LESSON_FIGS[les['id']]]
        les.pop('figure',None); changed.append(les['id'])
json.dump(L,open(P('data','lessons.json'),'w'),ensure_ascii=False,indent=2)
# glossary
G=json.load(open(P('data','glossary.json')))
REPLACED={'planes.svg','shoulder-landmarks.svg','shoulder-joint-8.svg','shoulder-girdle-6.svg','elbow-forearm.svg','spine-core.svg','knee-ankle.svg','hip-landmarks-muscles.svg'}
pri={'anatomy':0,'anim':1,'diagram':2}
MOVE_TERMS={'term-flexion','term-extension','term-abduction','term-adduction','term-internal-rotation','term-external-rotation','term-horizontal-abduction','term-horizontal-adduction',
 'term-pronation','term-supination','term-dorsiflexion','term-plantarflexion','term-lateral-flexion','term-rotation','term-elevation','term-depression','term-protraction','term-retraction',
 'term-upward-rotation','term-downward-rotation','term-lateral-raise','term-front-raise','term-chest-fly','term-reverse-fly','term-biceps-curl','term-triceps-ext','term-calf-raise','term-row','term-pulldown','term-glute-bridge','term-squat'}
EXTRA={'term-flexion':['anim-elbow-flex-ext','anim-hip-flex-ext'],'term-extension':['anim-elbow-flex-ext','anim-hip-flex-ext'],
       'term-abduction':['anim-hip-abd-add'],'term-adduction':['anim-hip-abd-add'],'term-scapula':[],'term-glenohumeral':['anim-shoulder-abd-add']}
n=0
for t in G['terms']:
    tid=t['id']
    hits=[f for f in F if tid in f['terms']]
    for x in EXTRA.get(tid,[]):
        if byid[x] not in hits: hits.append(byid[x])
    if not hits: continue
    if tid in MOVE_TERMS: hits.sort(key=lambda f:(0 if f['kind']=='anim' else 1 if f['kind']=='anatomy' else 2))
    else: hits.sort(key=lambda f:pri[f['kind']])
    figs=[figobj(f['id']) for f in hits[:3]]
    old=t.get('diagram')
    if old and os.path.basename(old['src']) not in REPLACED and not any(x['src']==old['src'] for x in figs):
        figs.append(old)
    t['figures']=figs; n+=1
json.dump(G,open(P('data','glossary.json'),'w'),ensure_ascii=False,indent=2)
print('figures',len(F),'lessons',changed,'terms',n)
