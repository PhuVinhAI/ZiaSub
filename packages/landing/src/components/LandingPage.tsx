import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const navItems = [
  ["Tính năng", "#tinh-nang"],
  ["Cách hoạt động", "#cach-hoat-dong"],
  ["Miễn phí", "#mien-phi"],
  ["Câu hỏi", "#cau-hoi"],
];

const featureCards = [
  {
    index: "01",
    title: "Dịch ngay trên video YouTube",
    description:
      "Mở video, chọn kiểu dịch và xem phụ đề xuất hiện ngay trong trình phát. Không cần tải video xuống hay chuyển qua nhiều ứng dụng.",
    image: "/visuals/feature-translate.svg",
    alt: "Minh hoạ ZiaSub dịch phụ đề trực tiếp trên video YouTube",
    className: "md:col-span-2",
  },
  {
    index: "02",
    title: "Video dài vẫn chạy có tổ chức",
    description:
      "Tự chia video thành từng phần, dịch song song, xem nhanh đoạn đầu, tạm dừng và tiếp tục đúng nơi đang dở.",
    image: "/visuals/feature-queue.svg",
    alt: "Minh hoạ hàng đợi và tiến trình dịch nhiều video",
    className: "md:col-span-1",
  },
  {
    index: "03",
    title: "Hỏi Zia về đúng đoạn bạn đang xem",
    description:
      "Chọn khoảng thời gian rồi tóm tắt, phân tích, lấy ý chính hoặc dịch nội dung video bằng Gemini.",
    image: "/visuals/feature-chat.svg",
    alt: "Minh hoạ trò chuyện với AI theo khoảng thời gian video",
    className: "md:col-span-1",
  },
  {
    index: "04",
    title: "Biên tập SRT bằng mắt, không bằng phỏng đoán",
    description:
      "Tua video, sửa từng câu, chỉnh mốc thời gian, thêm phụ đề tại vị trí hiện tại và xuất file SRT khi hoàn tất.",
    image: "/visuals/feature-editor.svg",
    alt: "Minh hoạ trình biên tập phụ đề SRT trực quan",
    className: "md:col-span-2",
  },
  {
    index: "05",
    title: "Phụ đề mang đúng gu của bạn",
    description:
      "Tinh chỉnh font, cỡ chữ, màu, viền, bóng, nền, vị trí, độ rộng và hiệu ứng xuất hiện cho cả màn hình dọc lẫn ngang.",
    image: "/visuals/feature-style.svg",
    alt: "Minh hoạ bảng tuỳ chỉnh phong cách phụ đề",
    className: "md:col-span-1",
  },
  {
    index: "06",
    title: "Key và dữ liệu nằm trên thiết bị",
    description:
      "Gemini API key chỉ lưu cục bộ. Lịch sử chat, bản dịch và cài đặt có thể backup, khôi phục và tự động sao lưu khi rời app.",
    image: "/visuals/feature-local.svg",
    alt: "Minh hoạ bảo mật API key và backup cục bộ",
    className: "md:col-span-1",
  },
];

const workflow = [
  {
    number: "01",
    title: "Mở video",
    text: "Dán URL hoặc tìm trực tiếp trên YouTube ngay trong ZiaSub.",
  },
  {
    number: "02",
    title: "Chọn kiểu dịch",
    text: "Dùng preset cho anime, game, phim, vlog, podcast… hoặc prompt riêng.",
  },
  {
    number: "03",
    title: "Xem và tinh chỉnh",
    text: "Phụ đề hiện trên video; bạn có thể sửa, dịch lại từng phần hoặc xuất SRT.",
  },
];

const freePoints = [
  {
    index: "01",
    title: "Không tài khoản",
    text: "Không đăng ký, không đăng nhập, không thu thập thông tin cá nhân. Mở app và dùng ngay.",
  },
  {
    index: "02",
    title: "Không mã kích hoạt",
    text: "Không gói thời hạn, không giới hạn tính năng, không phí ẩn. Mọi tính năng đều mở sẵn.",
  },
  {
    index: "03",
    title: "Dữ liệu trên thiết bị",
    text: "API key, lịch sử và bản dịch được lưu cục bộ, có thể backup và khôi phục bất cứ lúc nào.",
  },
];

const faq = [
  {
    question: "ZiaSub có miễn phí không?",
    answer:
      "Có. Toàn bộ tính năng đều miễn phí, không có gói trả phí và không giới hạn thời gian sử dụng.",
  },
  {
    question: "Có cần tài khoản hay mã kích hoạt không?",
    answer:
      "Không. ZiaSub không yêu cầu đăng ký tài khoản, không dùng mã kích hoạt và không khóa bất kỳ tính năng nào.",
  },
  {
    question: "ZiaSub có kèm Gemini API key không?",
    answer:
      "Không. Bạn dùng Gemini API key của riêng mình, có thể tạo miễn phí tại Google AI Studio. Key chỉ được lưu trên thiết bị của bạn.",
  },
  {
    question: "Video dài có bị mất tiến trình không?",
    answer:
      "App chia video thành từng phần và lưu tiến trình. Bạn có thể tạm dừng, tiếp tục hoặc chỉ dịch lại đúng phần bị lỗi.",
  },
  {
    question: "Có thể tự chỉnh phụ đề không?",
    answer:
      "Có. ZiaSub hỗ trợ dán/import SRT, biên tập trực quan theo thời gian video, tuỳ chỉnh phong cách hiển thị và xuất lại file SRT.",
  },
];

type CtaButtonProps = {
  label: string;
  href: string;
  dark?: boolean;
  className?: string;
};

function CtaButton({ label, href, dark = false, className = "" }: CtaButtonProps) {
  return (
    <a
      className={`cta-3d ${dark ? "cta-3d--dark" : ""} ${className}`}
      href={href}
    >
      <span className="relative z-10">{label}</span>
      <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-current opacity-65" />
    </a>
  );
}

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = "vi";
    document.title = "ZiaSub — Dịch phụ đề YouTube miễn phí bằng AI";

    const description =
      "ZiaSub dịch, hiển thị và biên tập phụ đề video YouTube bằng Gemini AI miễn phí trên điện thoại. Không tài khoản, không mã kích hoạt.";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
      const updateLenis = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(updateLenis);
      gsap.ticker.lagSmoothing(0);

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from("[data-hero-copy] > *", {
          y: 42,
          opacity: 0,
          duration: 0.85,
          stagger: 0.1,
        })
        .from(
          "[data-hero-visual]",
          { y: 60, rotate: 2.5, opacity: 0, duration: 1.1 },
          "-=0.72",
        )
        .from(
          "[data-float-chip]",
          { scale: 0.72, opacity: 0, duration: 0.55, stagger: 0.08 },
          "-=0.45",
        );

      gsap.to("[data-hero-visual]", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, {
          y: 48,
          opacity: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true,
          },
        });
      });

      gsap.from("[data-feature-card]", {
        y: 70,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#tinh-nang",
          start: "top 72%",
          once: true,
        },
      });

      gsap.from("[data-free-card]", {
        y: 48,
        opacity: 0,
        duration: 0.8,
        stagger: 0.09,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#mien-phi",
          start: "top 74%",
          once: true,
        },
      });

      return () => {
        lenis.destroy();
        gsap.ticker.remove(updateLenis);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative min-h-screen overflow-hidden bg-zia-bg text-zia-text">
      <div className="mesh-grid pointer-events-none absolute inset-x-0 top-0 h-[62rem] opacity-80" />

      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <div className="glass-panel mx-auto flex h-14 max-w-[88rem] items-center justify-between rounded-2xl px-3.5 sm:px-5">
          <a className="flex items-center gap-2.5" href="#top" aria-label="ZiaSub - về đầu trang">
            <img className="h-8 w-8" src="/visuals/brand-mark.svg" alt="" />
            <span className="font-display text-base font-bold tracking-[-0.04em]">ZiaSub</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Điều hướng chính">
            {navItems.map(([label, href]) => (
              <a
                key={href}
                className="text-xs font-bold text-zia-muted transition-colors hover:text-zia-text"
                href={href}
              >
                {label}
              </a>
            ))}
          </nav>

          <CtaButton
            label="Miễn phí 100%"
            href="#mien-phi"
            className="min-h-10! rounded-xl! px-3.5! py-2! text-[0.72rem]!"
          />
        </div>
      </header>

      <main id="top">
        <section
          data-hero
          className="page-shell relative grid min-h-[52rem] items-center gap-10 pb-16 pt-28 lg:min-h-screen lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:pb-24 lg:pt-32"
        >
          <div className="aurora -left-72 top-20" />

          <div data-hero-copy className="relative z-10 max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="rounded-full border border-zia-border bg-zia-purple-soft/70 px-3 py-1.5 text-[0.64rem] font-extrabold uppercase tracking-[0.15em] text-zia-purple">
                Mobile app · Android · Miễn phí
              </span>
              <span className="text-[0.68rem] font-bold text-zia-muted">Gemini AI ở ngay trong video</span>
            </div>

            <h1 className="display-type text-[clamp(3.2rem,14vw,6.8rem)] font-bold leading-[0.87] text-balance">
              Xem video.
              <span className="block bg-gradient-to-r from-zia-purple via-[#d8b4fe] to-zia-cyan bg-clip-text text-transparent">
                Hiểu mọi lời.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-7 text-[#c7cee6] sm:text-base sm:leading-8">
              ZiaSub dịch phụ đề YouTube bằng Gemini, hiển thị ngay trong trình phát và cho bạn sửa từng câu, từng mốc thời gian — miễn phí, không tài khoản, không mã kích hoạt.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
              <CtaButton label="Khám phá tính năng" href="#tinh-nang" />
              <CtaButton label="Xem cách hoạt động" href="#cach-hoat-dong" dark />
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 border-y border-zia-border/70 py-4">
              {[
                ["15", "kiểu dịch"],
                ["04", "tác vụ video"],
                ["100%", "miễn phí"],
              ].map(([value, label], index) => (
                <div key={label} className={`pr-3 ${index > 0 ? "border-l border-zia-border/70 pl-3" : ""}`}>
                  <div className="font-display text-lg font-bold text-zia-text sm:text-2xl">{value}</div>
                  <div className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-zia-muted sm:text-[0.64rem]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[43rem] lg:translate-x-8">
            <div className="aurora -right-56 top-12 opacity-80" />
            <div data-hero-visual className="relative z-10">
              <img
                className="feature-image mx-auto w-[94%] sm:w-[86%] lg:w-full"
                src="/visuals/hero-phone.svg"
                alt="Minh hoạ giao diện ZiaSub đang dịch phụ đề một video YouTube"
              />
              <div
                data-float-chip
                className="glass-panel absolute left-0 top-[18%] rounded-xl px-3 py-2 text-[0.65rem] font-extrabold text-zia-cyan sm:left-[2%] sm:text-xs"
              >
                Gemini đang dịch
              </div>
              <div
                data-float-chip
                className="glass-panel absolute bottom-[18%] right-0 rounded-xl px-3 py-2 text-[0.65rem] font-extrabold text-[#4ade80] sm:right-[2%] sm:text-xs"
              >
                SRT đã sẵn sàng
              </div>
            </div>
          </div>
        </section>

        <div className="relative border-y border-zia-border/60 bg-zia-surface/40 py-3.5 backdrop-blur-sm">
          <div className="overflow-hidden">
            <div className="marquee-track flex gap-8 pr-8 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-zia-muted">
              {[...Array(2)].flatMap((_, copy) =>
                ["Anime", "Gaming", "Phim", "Podcast", "Vlog", "Tin tức", "Giáo dục", "ASMR"].map((item) => (
                  <span key={`${copy}-${item}`} className="flex items-center gap-8">
                    {item}<span className="text-zia-purple">✦</span>
                  </span>
                )),
              )}
            </div>
          </div>
        </div>

        <section id="tinh-nang" className="page-shell py-24 sm:py-32">
          <div data-reveal className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <span className="eyebrow">Một app, trọn bộ công cụ</span>
              <h2 className="display-type mt-5 max-w-3xl text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
                Mọi thứ để video ngoại ngữ trở nên <span className="text-zia-purple">dễ xem, dễ hiểu.</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zia-muted lg:justify-self-end lg:text-base">
              Từ lúc mở video đến khi có bản phụ đề hoàn chỉnh, ZiaSub giúp bạn làm mọi thứ ngay trên điện thoại — nhanh hơn, liền mạch hơn và ít thao tác hơn.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => (
              <article
                key={feature.index}
                data-feature-card
                className={`glass-panel group relative overflow-hidden rounded-[1.4rem] p-4 sm:p-5 ${feature.className}`}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className="font-display text-xs font-bold text-zia-purple">/{feature.index}</span>
                  <span className="h-px flex-1 translate-y-2 bg-gradient-to-r from-zia-border to-transparent" />
                </div>
                <img
                  className="feature-image aspect-[4/3] w-full rounded-2xl object-contain transition-transform duration-700 group-hover:scale-[1.025]"
                  src={feature.image}
                  alt={feature.alt}
                  loading="lazy"
                />
                <div className="mt-5 max-w-2xl">
                  <h3 className="font-display text-xl font-bold tracking-[-0.04em] sm:text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-zia-muted sm:text-sm">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="cach-hoat-dong" className="relative border-y border-zia-border/60 bg-zia-surface/35 py-24 sm:py-32">
          <div className="aurora -right-64 top-20 opacity-40" />
          <div className="page-shell relative">
            <div data-reveal className="max-w-4xl">
              <span className="eyebrow">Ba bước là xem được</span>
              <h2 className="display-type mt-5 text-4xl font-bold leading-[0.96] sm:text-6xl lg:text-7xl">
                Từ URL đến phụ đề,
                <span className="outline-text block">không vòng vo.</span>
              </h2>
            </div>

            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {workflow.map((item) => (
                <article key={item.number} data-reveal className="glass-panel relative min-h-64 rounded-[1.4rem] p-5 sm:p-7">
                  <div className="font-display text-6xl font-bold text-zia-purple-soft sm:text-7xl">{item.number}</div>
                  <div className="absolute left-6 top-20 h-2 w-2 rounded-full bg-zia-cyan shadow-[0_0_24px_#38bdf8]" />
                  <h3 className="font-display mt-10 text-2xl font-bold tracking-[-0.04em]">{item.title}</h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-zia-muted">{item.text}</p>
                </article>
              ))}
            </div>

            <div data-reveal className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[1.4rem] border border-zia-purple/40 bg-zia-purple-soft/65 p-5 sm:flex-row sm:items-center sm:p-7">
              <div>
                <div className="font-display text-xl font-bold">Chưa có Gemini API key?</div>
                <p className="mt-2 text-sm text-[#c7cee6]">Tạo miễn phí trên Google AI Studio, rồi copy vào app. ZiaSub sẽ tự nhận key từ clipboard.</p>
              </div>
              <span className="shrink-0 rounded-full border border-zia-purple/50 bg-zia-bg/40 px-4 py-2 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-zia-cyan">
                Không mất phí · Không cần thẻ
              </span>
            </div>
          </div>
        </section>

        <section id="mien-phi" className="page-shell py-24 sm:py-32">
          <div data-reveal className="mx-auto max-w-4xl text-center">
            <span className="eyebrow">Miễn phí trọn vẹn</span>
            <h2 className="display-type mt-5 text-4xl font-bold leading-[0.95] sm:text-6xl lg:text-7xl">
              Không gói. Không mã.
              <span className="text-zia-purple"> Không ràng buộc.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zia-muted sm:text-base">
              ZiaSub mở toàn bộ tính năng cho mọi người. Bạn chỉ cần một Gemini API key của riêng mình — miễn phí và lưu ngay trên thiết bị.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {freePoints.map((point) => (
              <article
                key={point.index}
                data-free-card
                className="glass-panel relative flex min-h-56 flex-col rounded-[1.4rem] p-5 sm:p-7"
              >
                <span className="font-display text-xs font-bold text-zia-purple">/{point.index}</span>
                <h3 className="font-display mt-8 text-2xl font-bold tracking-[-0.04em]">{point.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zia-muted">{point.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cau-hoi" className="border-y border-zia-border/60 bg-zia-surface/30 py-24 sm:py-32">
          <div className="page-shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div data-reveal>
              <span className="eyebrow">FAQ</span>
              <h2 className="display-type mt-5 text-4xl font-bold leading-[0.96] sm:text-6xl">
                Những điều nên biết trước khi dùng.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-zia-muted">
                Thông tin cần thiết để bạn cài đặt và bắt đầu sử dụng ZiaSub — hoàn toàn miễn phí.
              </p>
            </div>

            <div className="divide-y divide-zia-border/70 border-y border-zia-border/70">
              {faq.map((item, index) => (
                <details key={item.question} data-reveal className="group py-5 open:pb-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-display text-base font-bold tracking-[-0.03em] sm:text-lg">
                    <span><span className="mr-3 text-xs text-zia-purple">0{index + 1}</span>{item.question}</span>
                    <span className="text-2xl font-light text-zia-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pt-4 text-sm leading-7 text-zia-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="page-shell py-20 sm:py-28">
          <div data-reveal className="relative overflow-hidden rounded-[1.7rem] border border-zia-purple/50 bg-zia-purple-soft px-5 py-14 text-center sm:px-10 sm:py-20">
            <div className="aurora left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-55" />
            <img className="relative mx-auto mb-6 h-20 w-20" src="/visuals/brand-mark.svg" alt="Biểu tượng ZiaSub" />
            <span className="relative text-[0.65rem] font-black uppercase tracking-[0.18em] text-zia-cyan">Miễn phí 100%</span>
            <h2 className="display-type relative mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[0.92] sm:text-6xl lg:text-7xl">
              Video vẫn chạy. Rào cản ngôn ngữ thì dừng lại.
            </h2>
            <p className="relative mx-auto mt-6 max-w-xl text-sm leading-7 text-[#c7cee6] sm:text-base">
              Thêm Gemini API key của bạn và bắt đầu ngay. Không tài khoản, không mã kích hoạt, không chi phí sử dụng.
            </p>
            <CtaButton
              label="Xem cách hoạt động"
              href="#cach-hoat-dong"
              className="relative mt-8 w-full sm:w-auto"
            />
          </div>
        </section>
      </main>

      <footer className="page-shell flex flex-col gap-5 border-t border-zia-border/60 py-8 text-xs text-zia-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <img className="h-7 w-7" src="/visuals/brand-mark.svg" alt="" />
          <span className="font-display font-bold text-zia-text">ZiaSub</span>
          <span>· Miễn phí · Không tài khoản · Không mã kích hoạt</span>
        </div>
        <span className="font-bold text-zia-purple">Dữ liệu ở lại trên thiết bị của bạn</span>
      </footer>
    </div>
  );
}
