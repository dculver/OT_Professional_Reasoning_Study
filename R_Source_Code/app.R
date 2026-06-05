library(shiny)
library(bslib)
library(jsonlite)
library(dplyr)
library(ggplot2)
library(S7)   # ggplot2 WebAssembly fix (keep for shinylive/webR)

## ======================================================================
## CODES + PRETEND FACULTY MODEL (the only simulated piece).
## The STUDENT network below is computed live from the real session.
## ======================================================================
codes <- c("CUE","FRAME","HYPO","PATIENT","INTERV","MONITOR")
code_labels <- c(
  CUE="Cue Acquisition", FRAME="Problem Framing", HYPO="Hypothesis Generation",
  PATIENT="Patient-Centered Reasoning", INTERV="Intervention Selection",
  MONITOR="Metacognitive Monitoring"
)
n <- length(codes)

faculty_mat <- matrix(c(
  0.0,0.8,0.9,0.5,0.3,0.4,
  0.3,0.0,0.8,0.6,0.2,0.5,
  0.4,0.5,0.0,0.8,0.7,0.7,
  0.3,0.4,0.6,0.0,0.8,0.6,
  0.2,0.2,0.4,0.5,0.0,0.7,
  0.4,0.4,0.6,0.6,0.7,0.0
), nrow=n, byrow=TRUE, dimnames=list(codes,codes))

## --- regex coding for the think-aloud (stand-in for nCoder/stringr) ----
code_regex <- list(
  CUE     = "vital|blood pressure|heart rate|\\blab|diagnos|stroke|injury|grip|strength|range of motion|sensation|imaging|i see|i notice|looking at|the chart|the data|MMT|MoCA",
  FRAME   = "reason for referral|the problem is|the issue|referred for|main concern|occupational profile|the goal of therapy|what we need|the task here|frame",
  HYPO    = "because|might be|could be|suggests|due to|probably|likely|caused by|indicates|consistent with|i think this is|my hypothesis|reasoning that",
  PATIENT = "she wants|he wants|patient'?s goal|her goal|his goal|important to|meaningful|lives alone|with (his|her) partner|family|at home|daily life|what matters|independen|return to work|prior level",
  INTERV  = "recommend|i would use|intervention|adaptive equipment|rocker knife|dycem|universal cuff|button hook|dressing stick|velcro|sign the order|the plan is|i'?ll choose|select the",
  MONITOR = "i'?m not sure|wait|actually|let me reconsider|on second thought|i should check|double.?check|reconsider|hmm|maybe i'?m wrong|let me think|am i (right|sure)|i changed my mind"
)

code_transcript <- function(segs) {
  ev <- list()
  if (is.null(segs) || nrow(segs) == 0) return(data.frame(t=numeric(0), code=character(0), source=character(0)))
  for (i in seq_len(nrow(segs))) {
    txt <- tolower(segs$text[i]); tt <- segs$start_ms[i]
    if (is.na(tt)) next
    for (cd in names(code_regex)) {
      if (grepl(code_regex[[cd]], txt, ignore.case=TRUE, perl=TRUE))
        ev[[length(ev)+1]] <- data.frame(t=tt, code=cd, source="verbal")
    }
  }
  if (length(ev)==0) return(data.frame(t=numeric(0), code=character(0), source=character(0)))
  bind_rows(ev)
}

## --- DIRECTED accumulation with PER-STREAM temporal windows ------------
## Transmodal principle ("functions, not fusion"; Shaffer, Wang & Ruis 2025):
## each modality stays "in context" for a different horizon. A prior event
## connects to the current event only if it falls within ITS OWN stream's
## window. These are first-approximation horizons -- tune/justify them, or
## swap this for the tma package's decay functions in production.
STREAM_WINDOW_MS <- c(gaze = 1500, click = 4000, verbal = 9000)

accumulate <- function(events) {            # events: data.frame(t, code, source) sorted
  m <- matrix(0, n, n, dimnames=list(codes,codes))
  if (nrow(events) < 2) return(m)
  events <- events[order(events$t), ]
  tt <- events$t; cc <- events$code; ss <- as.character(events$source)
  maxwin <- max(STREAM_WINDOW_MS)
  for (i in seq_along(tt)) {
    j <- i - 1
    while (j >= 1 && (tt[i] - tt[j]) <= maxwin) {   # outer bound = widest window
      win <- STREAM_WINDOW_MS[[ ss[j] ]]            # horizon of the PRIOR event's stream
      if (is.null(win) || is.na(win)) win <- maxwin
      if ((tt[i] - tt[j]) <= win && cc[j] != cc[i] && cc[j] %in% codes && cc[i] %in% codes)
        m[cc[j], cc[i]] <- m[cc[j], cc[i]] + 1      # prior -> current (responds to)
      j <- j - 1
    }
  }
  if (max(m) > 0) m <- m / max(m)            # normalize 0..1
  m
}

node_strength <- function(m) rowSums(m) + colSums(m)

## --- fixed interpretable 2D projection (NOT an SVD rotation) ------------
## x: procedural/premature (-)  <-->  patient-centered + framing (+)
## y: premature closure (-)     <-->  reflective monitoring (+)
Wx <- matrix(0,n,n,dimnames=list(codes,codes))
Wy <- matrix(0,n,n,dimnames=list(codes,codes))
for (a in codes) for (b in codes) if (a!=b) {
  if (a=="PATIENT"||b=="PATIENT"||a=="FRAME"||b=="FRAME") Wx[a,b] <- Wx[a,b] + 1
  if (a=="MONITOR"||b=="MONITOR")                          Wy[a,b] <- Wy[a,b] + 1
}
Wx["CUE","INTERV"] <- -2; Wx["HYPO","INTERV"] <- -1
Wy["CUE","INTERV"] <- -2; Wy["HYPO","INTERV"] <- -1
project <- function(m) c(
  x = sum(m*Wx)/sum(abs(Wx)),
  y = sum(m*Wy)/sum(abs(Wy))
)

## --- pretend faculty cloud: perturb the faculty matrix, project each ----
set.seed(42)
fac_pts <- do.call(rbind, lapply(1:15, function(i) {
  mm <- faculty_mat + matrix(rnorm(n*n, 0, 0.06), n, n)
  mm[mm<0] <- 0; diag(mm) <- 0
  p <- project(mm); data.frame(x=p["x"], y=p["y"])
}))

prompts <- list(
  "PATIENT|INTERV"="You moved toward equipment without firmly linking it to this patient's goals. Ask: how do this person's priorities shape which option fits?",
  "HYPO|PATIENT"="Your reasoning about the impairment stayed separate from the patient's context. Ask: how does my hypothesis connect to what matters to them?",
  "INTERV|MONITOR"="You committed to a plan with little self-checking. Ask: what would tell me this choice is wrong?",
  "HYPO|MONITOR"="You generated a hypothesis without revisiting it. Ask: what evidence would change my mind?",
  "CUE|FRAME"="You gathered cues but did not pause to frame the problem. Ask: what is the occupational problem before I act?",
  "FRAME|HYPO"="Framing and hypothesis rarely connected. Ask: does my hypothesis address the problem I framed?",
  "PATIENT|MONITOR"="Patient-centered thinking and self-monitoring stayed apart. Ask: am I checking my plan against their priorities?"
)
get_prompt <- function(a,b){ k1<-paste0(a,"|",b); k2<-paste0(b,"|",a)
  if(!is.null(prompts[[k1]]))return(prompts[[k1]]); if(!is.null(prompts[[k2]]))return(prompts[[k2]])
  paste0("Faculty linked ",code_labels[a]," and ",code_labels[b]," more than you did. How might these inform each other?") }

bar <- function(v,color) sprintf('<div style="background:#eee;border-radius:3px;height:10px;width:120px;display:inline-block;vertical-align:middle;"><div style="background:%s;height:10px;border-radius:3px;width:%d%%;"></div></div>', color, as.integer(round(v*100)))

idb_js <- "
async function getDataFromIDB(){return new Promise((resolve)=>{let req=indexedDB.open('OT_Simulation_DB',1);
 req.onsuccess=(e)=>{try{let db=e.target.result;let tx=db.transaction('sessions','readonly');let g=tx.objectStore('sessions').get('active_session');
 g.onsuccess=()=>resolve(g.result?g.result.data:'NO_DATA');g.onerror=()=>resolve('ERROR');}catch(err){resolve('NO_DATA');}};
 req.onerror=()=>resolve('ERROR');});}
$(document).on('shiny:connected',async function(){Shiny.setInputValue('jspsych_data',await getDataFromIDB());});"

## ======================================================================
## UI
## ======================================================================
ui <- page_fluid(
  theme = bs_theme(version=5, primary="#16263d", base_font=font_google("Open Sans")),
  tags$head(tags$script(HTML(idb_js))),
  tags$style(HTML("
    .demo-banner{background:#16263d;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;margin-bottom:10px;}
    .callout{background:#eafaf1;border-left:4px solid #27ae60;padding:14px 18px;border-radius:6px;}
    .gap-item{border-left:4px solid #c0392b;background:#fdf3f2;padding:10px 14px;margin-bottom:8px;border-radius:6px;}
    .str-item{border-left:4px solid #27ae60;background:#eafaf1;padding:10px 14px;margin-bottom:8px;border-radius:6px;}
    .conn-label{font-weight:700;}
  ")),
  div(class="demo-banner",
      "Your network is computed live from this session using per-stream temporal windows (gaze 1.5s, clicks 4s, think-aloud 9s) \u2014 a transmodal-style accumulation, not a single fused window. The faculty model is simulated; the centroid uses fixed interpretive axes, not an SVD rotation."),
  h2("Your Clinical Reasoning Feedback", style="color:#16263d;"),
  uiOutput("status"),
  uiOutput("personal_note"),
  layout_columns(
    col_widths=c(7,5),
    card(card_header("Where your reasoning landed"), plotOutput("centroid", height="420px"), uiOutput("centroid_callout")),
    card(card_header("What to work on"), uiOutput("plain_language"))
  ),
  navset_card_tab(
    nav_panel("Reasoning profile", plotOutput("radar", height="440px")),
    nav_panel("Connection map (heatmap)", plotOutput("heatmap", height="420px")),
    nav_panel("Connection detail", uiOutput("conn_table")),
    nav_panel("Data captured", uiOutput("data_summary"))
  )
)

## ======================================================================
## SERVER
## ======================================================================
server <- function(input, output, session) {

  # parse handoff -> merged coded event stream + student matrix (reactive)
  session_data <- reactive({
    raw <- input$jspsych_data
    if (is.null(raw) || raw %in% c("NO_DATA","ERROR")) return(NULL)
    tryCatch({
      d <- fromJSON(raw, simplifyVector = TRUE)
      gaze  <- d$gaze_events
      click <- d$click_events
      segs  <- d$transcript_segments
      ev <- list()
      if (!is.null(gaze)  && length(gaze)  && !is.null(gaze$t))  ev[[length(ev)+1]] <- data.frame(t=gaze$t,  code=gaze$code,  source="gaze")
      if (!is.null(click) && length(click) && !is.null(click$t)) ev[[length(ev)+1]] <- data.frame(t=click$t, code=click$code, source="click")
      verb <- code_transcript(segs)
      if (nrow(verb)) ev[[length(ev)+1]] <- verb
      events <- if (length(ev)) bind_rows(ev) else data.frame(t=numeric(0),code=character(0),source=character(0))
      list(events=events, mat=accumulate(events), choice=d$choice)
    }, error=function(e) NULL)
  })

  output$status <- renderUI({
    sd <- session_data()
    if (is.null(sd)) return(div(style="color:#c0392b;","Waiting for session data from the case… (run a case first, or this is being viewed standalone)."))
    div(style="color:#555;", sprintf("Built from %d coded events (gaze + clicks + think-aloud).", nrow(sd$events)))
  })

  output$personal_note <- renderUI({
    sd <- session_data(); if (is.null(sd)) return(NULL)
    ev <- sd$events
    if (nrow(ev)>0 && !("PATIENT" %in% ev$code[ev$source=="gaze"])) {
      div(style="background:#fdecea;border-left:4px solid #c0392b;padding:12px 16px;margin-bottom:14px;border-radius:6px;color:#922b21;",
          "You spent little or no visual attention on the patient-centered panels (goals / ADL observation). Notice how that shows up as weak Patient-Centered connections below.")
    } else NULL
  })

  output$centroid <- renderPlot({
    sd <- session_data()
    p <- if (is.null(sd)) c(x=NA,y=NA) else project(sd$mat)
    g <- ggplot() +
      annotate("rect", xmin=0, xmax=1.25, ymin=0, ymax=1.25, fill="#eafaf1") +
      geom_hline(yintercept=0, color="grey70") + geom_vline(xintercept=0, color="grey70") +
      stat_ellipse(data=fac_pts, aes(x,y), geom="polygon", alpha=0.15, fill="#3498db", color="#2980b9") +
      geom_point(data=fac_pts, aes(x,y), color="#2980b9", alpha=0.55, size=2.5)
    if (!is.na(p["x"])) g <- g +
      geom_point(aes(x=p["x"], y=p["y"]), color="#d35400", size=6) +
      annotate("text", x=p["x"], y=p["y"]-0.12, label="You", color="#d35400", fontface="bold", size=5)
    g + annotate("text", x=0.62, y=1.12, label="Integrated & reflective\n(faculty region)", color="#1e8449", size=4) +
      coord_cartesian(xlim=c(-1.2,1.25), ylim=c(-1.2,1.25)) +
      labs(x="Procedural / premature   \u2190        \u2192   Patient-centered + framing",
           y="Premature closure   \u2190        \u2192   Reflective monitoring") +
      theme_minimal(base_size=13) + theme(panel.grid.minor=element_blank())
  })

  output$centroid_callout <- renderUI({
    sd <- session_data(); if (is.null(sd)) return(NULL)
    p <- project(sd$mat)
    msg <- if (p["x"] >= 0.2 && p["y"] >= 0.2) "Your network sits near the faculty region: you connected patient context and self-monitoring while reasoning."
      else if (p["x"] < 0 && p["y"] < 0) "Your network sits opposite the faculty region: reasoning leaned procedural and moved toward a decision with little patient-centered or reflective connection."
      else "Your network sits between the faculty region and the procedural/premature corner \u2014 some integration, room to connect patient context and monitoring more."
    div(class="callout", style="margin-top:10px;", HTML(paste0("<strong>What this means:</strong> ", msg)))
  })

  dyads_r <- reactive({
    sd <- session_data(); req(sd)
    sm <- sd$mat
    expand.grid(from=codes,to=codes,stringsAsFactors=FALSE) |>
      filter(from!=to) |>
      mutate(s=mapply(function(a,b) sm[a,b], from,to),
             f=mapply(function(a,b) faculty_mat[a,b], from,to),
             gap=f-s, pair=paste0(code_labels[from]," \u2192 ",code_labels[to]))
  })

  output$plain_language <- renderUI({
    sd <- session_data(); if (is.null(sd)) return(HTML("<p>No session yet.</p>"))
    d <- dyads_r()
    strengths <- d |> arrange(desc(s)) |> filter(s>0) |> head(3)
    gaps <- d |> arrange(desc(gap)) |> head(5)
    str_html <- if (nrow(strengths)) paste0("<div class='str-item'><div class='conn-label' style='color:#1e8449'>",
        strengths$pair,"</div><div>You connected these most.</div></div>", collapse="") else "<p>Few connections detected yet.</p>"
    gap_html <- paste0("<div class='gap-item'><div class='conn-label' style='color:#922b21'>",
        code_labels[gaps$from]," \u2194 ",code_labels[gaps$to],
        "</div><div>", mapply(get_prompt, gaps$from, gaps$to), "</div></div>", collapse="")
    HTML(paste0("<h5 style='color:#27ae60;'>Your strongest connections</h5>", str_html,
                "<h5 style='color:#c0392b;margin-top:14px;'>Underdeveloped vs. faculty</h5>", gap_html))
  })

  output$radar <- renderPlot({
    sd <- session_data(); req(sd)
    fac_r <- node_strength(faculty_mat); stu_r <- node_strength(sd$mat)
    mx <- max(c(fac_r, stu_r, 1e-6)); fac_r <- fac_r/mx; stu_r <- stu_r/mx
    short <- c("Cue\nAcquisition","Problem\nFraming","Hypothesis","Patient-\nCentered","Intervention","Metacog.\nMonitoring")
    ang <- seq(pi/2, pi/2-2*pi, length.out=n+1)[1:n]
    par(mar=c(1,1,1,1)); plot.new(); plot.window(xlim=c(-1.4,1.4), ylim=c(-1.4,1.4), asp=1)
    for (r in c(.25,.5,.75,1)) { a<-seq(0,2*pi,length.out=120); lines(r*cos(a), r*sin(a), col="grey88") }
    for (i in 1:n) { lines(c(0,cos(ang[i])), c(0,sin(ang[i])), col="grey88")
      adjx <- if (cos(ang[i])>.15) 0 else if (cos(ang[i])< -.15) 1 else .5
      text(1.22*cos(ang[i]), 1.22*sin(ang[i]), short[i], cex=.85, col="#16263d", adj=c(adjx,.5)) }
    dp <- function(v,fill,bd) polygon(v*cos(ang), v*sin(ang), col=fill, border=bd, lwd=2)
    dp(fac_r, adjustcolor("#3498db",.25), "#2980b9")
    dp(stu_r, adjustcolor("#e67e22",.30), "#d35400")
    legend("bottomleft", legend=c("Faculty mean","You"),
           fill=c(adjustcolor("#3498db",.5), adjustcolor("#e67e22",.6)), border=NA, bty="n", cex=1)
  })

  output$heatmap <- renderPlot({
    sd <- session_data(); req(sd)
    hm <- rbind(transform(as.data.frame(as.table(sd$mat)), who="You"),
                transform(as.data.frame(as.table(faculty_mat)), who="Faculty"))
    names(hm)[1:3] <- c("from","to","strength")
    hm$from <- factor(as.character(hm$from), levels=rev(codes))
    hm$to   <- factor(as.character(hm$to),   levels=codes)
    hm$who  <- factor(hm$who, levels=c("You","Faculty"))
    ggplot(hm, aes(to, from, fill=strength)) + geom_tile(color="white", linewidth=.6) + facet_wrap(~who) +
      scale_fill_gradient(low="#f7fbff", high="#08519c", limits=c(0,1)) +
      labs(x="To (target code)", y="From (source code)", fill="Strength") +
      theme_minimal(base_size=12) + theme(axis.text.x=element_text(angle=45,hjust=1), panel.grid=element_blank())
  })

  output$conn_table <- renderUI({
    sd <- session_data(); if (is.null(sd)) return(HTML("<p>No session yet.</p>"))
    d <- dyads_r() |>
      mutate(tier=case_when(s>=0.45 & gap<=0.2 ~ "Aligned with faculty", gap>=0.4 ~ "Underdeveloped vs. faculty", TRUE ~ "Emerging"))
    tc <- c("Aligned with faculty"="#27ae60","Emerging"="#f39c12","Underdeveloped vs. faculty"="#c0392b")
    rows <- ""
    for (t in names(tc)) {
      sub <- d[d$tier==t,]; if (nrow(sub)==0) next
      sub <- sub[order(-sub$s),]
      rows <- paste0(rows, "<h5 style='color:",tc[t],";margin-top:14px;'>",t,"</h5>",
        "<table style='width:100%;border-collapse:collapse;font-size:13px;'><tr style='color:#777;text-align:left;'><th>Connection</th><th>You</th><th>Faculty</th></tr>")
      for (i in seq_len(nrow(sub))) rows <- paste0(rows, "<tr style='border-top:1px solid #eee;'><td style='padding:6px 4px;'>",
        sub$pair[i],"</td><td>",bar(sub$s[i],"#e67e22"),"</td><td>",bar(sub$f[i],"#3498db"),"</td></tr>")
      rows <- paste0(rows, "</table>")
    }
    HTML(rows)
  })

  output$data_summary <- renderUI({
    sd <- session_data(); if (is.null(sd)) return(HTML("<p>No session yet.</p>"))
    ev <- sd$events
    by_src <- as.data.frame(table(ev$source)); by_code <- as.data.frame(table(ev$code))
    HTML(paste0("<p><strong>",nrow(ev),"</strong> coded events.</p>",
      "<p>By stream: ", paste(by_src$Var1, by_src$Freq, sep="=", collapse=", "), "</p>",
      "<p>By code: ", paste(by_code$Var1, by_code$Freq, sep="=", collapse=", "), "</p>",
      "<p>Equipment chosen: <strong>", ifelse(is.null(sd$choice)||is.na(sd$choice),"(none)",sd$choice), "</strong></p>"))
  })
}

shinyApp(ui, server)
