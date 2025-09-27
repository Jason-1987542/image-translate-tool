const input = document.getElementById('imageInput');
const startBtn = document.getElementById('startBtn');
const langSelect = document.getElementById('langSelect');
const statusArea = document.getElementById('statusArea');
const iframeContainer = document.getElementById('iframeContainer');
const exportBtn = document.getElementById('exportCsv');

let translations = [];

function log(msg) {
  const p = document.createElement('p');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  statusArea.appendChild(p);
}

startBtn.onclick = async () => {
  const files = input.files;
  const lang = langSelect.value;

  if (files.length === 0) {
    alert("请先上传图片！");
    return;
  }

  log(`🚀 开始处理 ${files.length} 张图片，目标语言：${lang}`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      const dataUrl = e.target.result;

      const iframe = document.createElement('iframe');
      iframe.src = `https://translate.google.com/?sl=auto&tl=${lang}&op=images`;
      iframe.onload = () => {
        setTimeout(() => {
          // 注入监听器到 iframe 页面
          iframe.contentWindow.postMessage({
            cmd: "UPLOAD_IMAGE",
            fileName: file.name,
            fileData: dataUrl
          }, "*");
        }, 3000);
      };

      iframeContainer.appendChild(iframe);
    };

    reader.readAsDataURL(file);
  }
};

// 收到翻译结果
window.addEventListener("message", (e) => {
  if (e.data && e.data.cmd === "TRANSLATE_RESULT") {
    const { fileName, resultText } = e.data;
    translations.push({ fileName, resultText });
    log(`📝 收到翻译结果：${fileName} => ${resultText}`);
  }
});

// 导出 CSV
exportBtn.onclick = () => {
  if (translations.length === 0) {
    alert("暂无翻译可导出！");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,文件名,翻译结果\n";
  translations.forEach(row => {
    csvContent += `${row.fileName},"${row.resultText}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "翻译结果.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  log("✅ CSV 已导出！");
};