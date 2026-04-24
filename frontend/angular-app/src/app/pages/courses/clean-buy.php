<?php
$file = 'course-detail.component.ts';
$content = file_get_contents($file);

$search = 'next: (res) => {
        this.paymentLoading = false;
        if (res.session_url) window.location.href = res.session_url; else if (res.session_url) window.location.href = res.session_url;
      },';

$replace = 'next: (res) => {
        this.paymentLoading = false;
        if (res.session_url) {
          window.location.href = res.session_url;
        } else if (res.free) {
          this.enrolled = true;
          this.loadCourseDetails();
        }
      },';

$content = str_replace($search, $replace, $content);
file_put_contents($file, $content);
echo "✅ Méthode buyAndEnroll nettoyée\n";
