const progressStorageKey = 'vibeLabProgress';
const getElement = (id) => document.getElementById(id);

function init() {
  highlightCodeBlocks();
  addLanguageLabels();
  addLineNumbers();
  makeCodeBlocksExpandable();
  loadProgress();
  attachSmoothScroll();
  window.addEventListener('scroll', handleProgressStripHighlight);
}

document.addEventListener('DOMContentLoaded', init);

function highlightCodeBlocks() {
  if (window?.Prism) {
    window.Prism.highlightAll();
  }
}

function addLanguageLabels() {
  document.querySelectorAll('.code-block pre[class*="language-"]').forEach((pre) => {
    const codeBlock = pre.closest('.code-block');
    if (!codeBlock || codeBlock.hasAttribute('data-language')) return;
    
    const classList = pre.className;
    const match = classList.match(/language-(\w+)/);
    if (match && match[1]) {
      const lang = match[1];
      codeBlock.setAttribute('data-language', lang);
    }
  });
}

function addLineNumbers() {
  document.querySelectorAll('.code-block pre[class*="language-"]').forEach((pre) => {
    // Only add to code blocks longer than 10 lines
    const code = pre.querySelector('code');
    if (code && code.textContent.split('\n').length > 10) {
      pre.classList.add('line-numbers');
    }
  });
}

function makeCodeBlocksExpandable() {
  document.querySelectorAll('.code-block pre').forEach((pre) => {
    const codeBlock = pre.closest('.code-block');
    if (!codeBlock) return;
    
    // If code block is taller than 400px, make it expandable
    if (pre.scrollHeight > 400) {
      codeBlock.classList.add('expandable');
      
      // Add expand button
      const expandBtn = document.createElement('button');
      expandBtn.className = 'expand-code-btn';
      expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show More';
      expandBtn.onclick = () => toggleCodeExpansion(codeBlock, expandBtn);
      codeBlock.appendChild(expandBtn);
    }
  });
}

function toggleCodeExpansion(codeBlock, button) {
  codeBlock.classList.toggle('expanded');
  if (codeBlock.classList.contains('expanded')) {
    button.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less';
  } else {
    button.innerHTML = '<i class="fas fa-chevron-down"></i> Show More';
    codeBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function loadProgress() {
  const saved = localStorage.getItem(progressStorageKey);
  if (saved) {
    const checkedIds = JSON.parse(saved);
    document.querySelectorAll('.checklist-item').forEach((item) => {
      const id = item.getAttribute('data-id');
      if (id && checkedIds.includes(id)) {
        item.classList.add('checked');
        const icon = item.querySelector('i');
        icon?.classList.remove('far', 'fa-square');
        icon?.classList.add('fas', 'fa-check-square');
      }
    });
  }
  updateGlobalProgress();
}

function saveProgress() {
  const checkedItems = [];
  document.querySelectorAll('.checklist-item.checked').forEach((item) => {
    const id = item.getAttribute('data-id');
    if (id) {
      checkedItems.push(id);
    }
  });
  localStorage.setItem(progressStorageKey, JSON.stringify(checkedItems));
}

function updateGlobalProgress() {
  const mainView = getElement('main-view');
  if (!mainView) return;
  const allCheckboxes = mainView.querySelectorAll('.checklist-item');
  const checkedBoxes = mainView.querySelectorAll('.checklist-item.checked');
  const progress = allCheckboxes.length
    ? (checkedBoxes.length / allCheckboxes.length) * 100
    : 0;
  const bar = getElement('global-progress');
  const text = getElement('progress-text');

  if (bar) {
    bar.style.width = `${progress}%`;
  }
  if (text) {
    text.innerText = `${Math.round(progress)}% Complete`;
    if (progress > 0) {
      text.classList.remove('hidden');
    }
  }
}

function changeScenario(direction) {
  // This function is kept for compatibility but does nothing since we only have one scenario
  return;
}

function toggleView(viewId, scrollTargetId) {
  const main = getElement('main-view');
  const prereqs = getElement('prereqs-view');
  const concepts = getElement('concepts-view');
  const progressStrip = getElement('progress-strip');
  const mainNav = getElement('main-nav');

  if (!main || !prereqs || !concepts) return;

  main.classList.add('hidden');
  prereqs.classList.add('hidden');
  concepts.classList.add('hidden');

  if (viewId === 'prereqs') {
    prereqs.classList.remove('hidden');
    progressStrip?.classList.add('hidden');
    mainNav?.classList.add('hidden');
    window.scrollTo(0, 0);
  } else if (viewId === 'concepts') {
    concepts.classList.remove('hidden');
    progressStrip?.classList.add('hidden');
    mainNav?.classList.add('hidden');
    window.scrollTo(0, 0);
  } else {
    main.classList.remove('hidden');
    progressStrip?.classList.remove('hidden');
    mainNav?.classList.remove('hidden');
    if (scrollTargetId) {
      setTimeout(() => {
        const target = getElement(scrollTargetId);
        target?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }
}

function copyToClipboard(button) {
  const container = button.closest('.code-block');
  const codeElement = container?.querySelector('code');
  const textToCopy = codeElement?.innerText || codeElement?.textContent;
  if (!textToCopy) return;

  const onSuccess = () => {
    showToast();
    const originalText = button.innerText;
    button.innerText = 'Copied!';
    button.classList.add('bg-green-500', 'text-white');
    button.classList.remove('bg-slate-700');
    setTimeout(() => {
      button.innerText = originalText;
      button.classList.remove('bg-green-500', 'text-white');
      button.classList.add('bg-slate-700');
    }, 2000);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
      fallbackCopy(textToCopy, onSuccess);
    });
  } else {
    fallbackCopy(textToCopy, onSuccess);
  }
}

function fallbackCopy(text, onSuccess) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) onSuccess();
  } catch (err) {
    console.error('Fallback copy failed', err);
  }
  document.body.removeChild(textArea);
}

function showToast() {
  const toast = getElement('toast');
  if (!toast) return;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  const icon = el.querySelector('i');
  if (el.classList.contains('checked')) {
    icon?.classList.remove('far', 'fa-square');
    icon?.classList.add('fas', 'fa-check-square');
  } else {
    icon?.classList.remove('fas', 'fa-check-square');
    icon?.classList.add('far', 'fa-square');
  }
  saveProgress();
  updateGlobalProgress();
}

function switchTab(tabId) {
  const tabs = ['tab-workflow', 'tab-api'];
  tabs.forEach((id) => {
    const el = getElement(id);
    if (!el) return;
    if (id === tabId) {
      el.classList.remove('hidden');
      if (id === 'tab-workflow') {
        el.classList.add('grid');
      }
    } else {
      el.classList.add('hidden');
      el.classList.remove('grid');
    }
  });

  const btnWorkflow = getElement('btn-workflow');
  const btnApi = getElement('btn-api');
  if (tabId === 'tab-workflow') {
    btnWorkflow?.classList.add('border-green-400', 'text-white');
    btnWorkflow?.classList.remove('border-transparent', 'text-indigo-300');
    btnApi?.classList.remove('border-green-400', 'text-white');
    btnApi?.classList.add('border-transparent', 'text-indigo-300');
  } else {
    btnApi?.classList.add('border-green-400', 'text-white');
    btnApi?.classList.remove('border-transparent', 'text-indigo-300');
    btnWorkflow?.classList.remove('border-green-400', 'text-white');
    btnWorkflow?.classList.add('border-transparent', 'text-indigo-300');
  }
}

function attachSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      targetElement?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function handleProgressStripHighlight() {
  const sections = ['phase1', 'phase2', 'phase3'];
  const navLinks = {
    phase1: getElement('prog-1'),
    phase2: getElement('prog-2'),
    phase3: getElement('prog-3')
  };

  let current = '';
  sections.forEach((sectionId) => {
    const section = getElement(sectionId);
    if (!section) return;
    const sectionTop = section.offsetTop;
    if (window.scrollY >= sectionTop - 300) {
      current = sectionId;
    }
  });

  if (current) {
    Object.keys(navLinks).forEach((key) => {
      const link = navLinks[key];
      if (!link) return;
      link.classList.remove('text-okta-blue', 'font-bold');
      link.classList.add('text-slate-400');
    });
    const activeLink = navLinks[current];
    activeLink?.classList.remove('text-slate-400');
    activeLink?.classList.add('text-okta-blue', 'font-bold');
  }
}

function downloadGlossary() {
  // Create a simple text version of the glossary for download
  const glossaryText = `
OKTA SE VIBE LAB - QUICK REFERENCE GUIDE
=========================================

📌 Live Preview
A VS Code extension that shows a real-time preview of your HTML file. Changes appear instantly without manual refresh.

🤖 GitHub Copilot
An AI pair programmer that lives inside VS Code. It suggests code completions, explains functions, and helps debug errors.

🔗 Separation of Concerns
A design principle that divides code into distinct files: HTML (structure), CSS (style), JavaScript (behavior). Makes code easier to maintain.

💾 localStorage
Browser storage that persists data even after closing the page. Used here to save your progress through the labs.

🎨 Inline JavaScript
JavaScript code embedded directly in an HTML file using <script> tags. Simple but not scalable for large projects.

🧩 Prompt Engineering
The art of writing clear, specific instructions for AI tools. Good prompts describe outcomes, not implementation details.

🔐 Okta Identity Governance (OIG)
Okta's governance solution for access reviews, certifications, and compliance workflows. Ideal for regulated industries.

♻️ Lifecycle Management (LCM)
Automates user provisioning, deprovisioning, and updates across applications using SCIM or proprietary connectors.

🛡️ Okta Privileged Access (OPA)
Secures privileged accounts with just-in-time access, session recording, and zero standing privileges for infrastructure.

📱 Device Trust
Verifies device posture (OS version, encryption, etc.) before granting access. Part of zero trust security strategies.

🔄 SCIM (System for Cross-domain Identity Management)
An open standard for automating user provisioning. Supported by most SaaS apps for seamless user management.

🎯 Multi-Factor Authentication (MFA)
Requires two or more verification factors (password + phone, biometric, etc.) to authenticate. Critical for security.

PRO TIPS:
- Bookmark this page: Your progress is saved automatically
- Work at your pace: No need to complete all labs in one session
- Copy code carefully: Use the copy buttons to avoid typos
- Ask questions: Paste errors into Copilot Chat or Gemini

© 2025 Okta Identity Lab - Created for Engineering Enablement
`;

  const blob = new Blob([glossaryText], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'okta-se-vibe-lab-glossary.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast();
}

// Expose functions for inline handlers
window.changeScenario = changeScenario;
window.toggleView = toggleView;
window.copyToClipboard = copyToClipboard;
window.switchTab = switchTab;
window.toggleCheck = toggleCheck;
window.downloadGlossary = downloadGlossary;
