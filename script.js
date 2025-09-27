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
        log(`🪟 第 ${i + 1} 个翻译窗口已打开：${file.name}`);

        setTimeout(() => {
          // 给 iframe 发送图片数据
          iframe.contentWindow.postMessage({
            cmd: "UPLOAD_IMAGE",
            fileName: file.name,
            fileData: dataUrl
          }, "*");
        }, 4000);
      };

      iframeContainer.appendChild(iframe);
    };

    reader.readAsDataURL(file);
  }
};

// 收到每个 iframe 的翻译结果
window.addEventListener("message", function (e) {
  if (e.data && e.data.cmd === "TRANSLATE_RESULT") {
    const { fileName, resultText } = e.data;
    translations.push({ fileName, resultText });
    log(`✅ 翻译完成：${fileName} ➜ ${resultText}`);
  }
});

// 导出翻译结果为 CSV
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
  log("📄 CSV 导出完成！");
};

/////////////////////////////////////////////////////////
// ✅ 以下代码是 iframe 页面专用，用于上传图 & 获取翻译文字
/////////////////////////////////////////////////////////

window.addEventListener("message", function (e) {
  if (!e.data || e.data.cmd !== "UPLOAD_IMAGE") return;

  const { fileName, fileData } = e.data;
  console.log("📥 收到主页面传来的图片：" + fileName);

  const tryUpload = setInterval(() => {
    const input = document.querySelector('input[type="file"]');
    if (input) {
      clearInterval(tryUpload);

      fetch(fileData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], fileName, { type: blob.type });
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;

          const event = new Event("change", { bubbles: true });
          input.dispatchEvent(event);

          console.log("📤 模拟图片上传成功：" + fileName);

          waitForTranslateResult(fileName);
        });
    }
  }, 1000);
});

function waitForTranslateResult(fileName) {
  const tryExtract = setInterval(() => {
    const resultNode = document.querySelector('[jsname="W297wb"]');

    if (resultNode && resultNode.innerText.trim()) {
      clearInterval(tryExtract);

      const resultText = resultNode.innerText.trim();
      console.log("📝 获取翻译结果：" + resultText);

      // 发回主页面
      window.parent.postMessage({
        cmd: "TRANSLATE_RESULT",
        fileName,
        resultText
      }, "*");
    }
  }, 2500); // 每2.5秒检查翻译结果
}
