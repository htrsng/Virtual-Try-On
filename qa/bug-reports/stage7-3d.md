# 3D findings — 17/11/2026

## BUG-3D-01 — Requested M displays S

P1 Application Defect. Source App wrapper nền `1ad8092`, QA shirt50101 có S/M/L.
Mở `/try-on?product_id=50101&size=M`: trước sửa, UI là Size S và scene loader mount
`Ao_Thun_sizeS.glb`. HTTP200, contextLost=false,9182triangles và canvas có render.
Probe Fail vì expected mounted M; attachment ghi meshes/vertices/bounds/URL thực.
Trace SHA256 `6DC240889AD436C71CC36F961F1C323C96FA139B28103D9E7112AEDA056D5E06`.
Raw trace được giữ `.runtime/stage7/probe-record/trace.zip`, không commit toàn trace.

Development fix: key viewer theo explicit selected product/size để state default
trước khi route resolve không ghi đè requested size sau khi dữ liệu đến.
QA: 3D-01 kiểm tra mounted GLB M rồi chuyển L/S và đối chiếu bounds/HTTP response.

## BUG-3D-02 — Geometry increases after warmed size switches

P1 Application Defect. Warm S/L/M rồi lặp S/L/M/L/S/M: functional2 thấy geometry
21→26 dù chỉ còn một garment. Test giới hạn warm+2 Fail, không đổi threshold để Pass.
Binding clone geometry để skin offset và tạo skeleton/material riêng nhưng chưa
dispose/restore đầy đủ khi thay size.

Development fix: restore original geometry/skeleton, dispose clone riêng của bind;
dispose owned material/texture/skeleton khi unmount, giữ nguyên resources shared
với GLTF cache. QA: cùng stress case phải giữ resource counts bounded sau warm.
Đây là renderer resource count regression, chưa định lượng được GPU bytes/long-run
device impact; không tuyên bố memory đã hết mọi leak trên mọi thiết bị.

## Test/environment findings

Render stability finding: the first full regression had12 Pass/1 Fail because a
preset intermittently settled atx5.192834579 instead of5.2. RAF animation and
OrbitControls damping could each move the camera at the end of a transition.
Camera now transitions in the R3F frame loop, pauses controls during transition,
drains deltas then hands control back at the exact target. The assertion/tolerance
was not loosened; camera preset/zoom/drag/reset subsequently passed3/3 repeats.
This is a render-profile synchronization fix, separate from the two findings above.

- Camera hover ban đầu dùng canvas có pointer-events:none do R3F eventSource;
  sửa test tương tác wrapper thật, không force click hoặc gọi camera setter.
- Phiên functional1 bị ngắt, không có kết quả suite hoàn chỉnh; không tính Pass.
- HDR city CDN được vendor đúng bytes/commit thành local runtime asset có attribution.
- QA static animation, read-only diagnostics và reset-view action là Development
  support cho kiểm thử; không ghi chúng thành test coverage có sẵn trước thay đổi.
- Wrong-GLB injection là negative control có chủ đích, không phải một bug production
  đã tái hiện. Baseline review và retest cuối xem execution report.
- Typecheck đã phát hiện reducedMotion phải đặt trong contextOptions. Config được
  chỉnh và visual test kiểm tra matchMedia thực; không chỉ tin vào config khai báo.
- Locator canvas screenshot mặc định không ổn định khi scroll/actionability của
  vùng R3F; final oracle dùng native WebGL PNG, pixel settle và snapshot comparison.
  Các ảnh có DOM overlays trước đó bị loại trước khi xin baseline approval.

## Retest cuối

BUG-3D-01 và BUG-3D-02: **Fixed, local retest Pass**. Camera stability fix:3/3 repeats
Pass; final regression13/13 và visual repeat riêng Pass. GPU resource plateau giữ
geometries19→19/textures17→17 trong recorded run, không nới threshold.
Hai baseline PNG đã được người dùng duyệt và không đổi hash. Wrong-model negative
control xác minh pixel mismatch có diff/trace trên source cuối; đây không phải một
case regression được coi là Pass khi render sai. CI GitHub chưa có run được xác minh.

Xem [execution report](../docs/stage-7-playwright-3d.md) và
[curated summary](../evidence/stage7-2026-11-17/summary.json).
