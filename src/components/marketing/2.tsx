"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import Button1 from "../button/Button1";
import { useState } from "react";

// Update the nodes array:
const nodes = [
  { id: "Client (jij)", x: 100, y: 200 },
  { id: "PolarLearn", x: 300, y: 200 },
  { id: "PolarAuth", x: 350, y: 150 }, // replaced Auth.js with PolarAuth
  { id: "Prisma", x: 400, y: 200 },
  { id: "Database", x: 500, y: 200 }
];

// Modify links array by removing the continuous (via) link:
interface Link {
  source: string;
  target: string;
  custom?: boolean;
  via?: string;
}

const links: Link[] = [
  { source: "Client (jij)", target: "PolarLearn" },
  { source: "PolarLearn", target: "PolarAuth", custom: true }, // updated: Auth.js -> PolarAuth
  { source: "PolarAuth", target: "Prisma", custom: true },       // updated: Auth.js -> PolarAuth
  { source: "PolarLearn", target: "Prisma" },
  { source: "Prisma", target: "Database" },
  { source: "Database", target: "Prisma" },
  { source: "Prisma", target: "PolarAuth", custom: true },       // updated: Auth.js -> PolarAuth
  { source: "PolarAuth", target: "PolarLearn", custom: true },     // updated: Auth.js -> PolarAuth
  { source: "PolarLearn", target: "Client (jij)" }
];

const SecondMarketingComponent = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous SVG

    // Create groups:
    const linksGroup = svg.append("g").attr("class", "links-group");
    const nodesGroup = svg.append("g").attr("class", "nodes-group");

    // Append header text inside the SVG (above Client→Server line)
    svg.append("text")
      .attr("class", "header-text")
      .attr("x", 200)
      .attr("y", 160)
      .attr("dy", "0em")
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("fill", "white")
      .style("font-weight", "bold")
      .text(text);

    // Draw straight base links in gray:
    linksGroup.selectAll(".base-link")
      .data(links.filter(l => !l.custom))
      .enter()
      .append("line")
      .attr("x1", d => nodes.find(n => n.id === d.source)!.x)
      .attr("y1", d => nodes.find(n => n.id === d.source)!.y)
      .attr("x2", d => nodes.find(n => n.id === d.target)!.x)
      .attr("y2", d => nodes.find(n => n.id === d.target)!.y)
      .attr("stroke", "gray")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round");

    // Draw custom curved links:
    linksGroup.selectAll(".custom-link")
      .data(links.filter(l => l.custom))
      .enter()
      .append("polyline")
      .attr("points", d => {
        if (d.via) {
          const source = nodes.find(n => n.id === d.source)!;
          const via = nodes.find(n => n.id === d.via)!;
          const target = nodes.find(n => n.id === d.target)!;
          return `${source.x},${source.y} ${source.x},${via.y} ${via.x},${via.y} ${via.x},${target.y} ${target.x},${target.y}`;
        } else if (d.source === "PolarLearn" && d.target === "Prisma") {
          const server = nodes.find(n => n.id === "PolarLearn")!;
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const prisma = nodes.find(n => n.id === "Prisma")!;
          return `${server.x},${server.y} ${server.x},${auth.y} ${auth.x},${auth.y} ${prisma.x},${auth.y} ${prisma.x},${prisma.y}`;
        } else if (d.source === "PolarLearn" && d.target === "PolarAuth") {
          const server = nodes.find(n => n.id === "PolarLearn")!;
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          return `${server.x},${server.y} ${server.x},${auth.y} ${auth.x},${auth.y}`;
        } else if (d.source === "PolarAuth" && d.target === "Prisma") {
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const prisma = nodes.find(n => n.id === "Prisma")!;
          const offset = prisma.x - auth.x;
          return `${auth.x},${auth.y} ${auth.x + offset},${auth.y} ${auth.x + offset},${prisma.y}`;
        } else if (d.source === "PolarAuth" && d.target === "PolarLearn") {
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const server = nodes.find(n => n.id === "PolarLearn")!;
          return `${auth.x},${auth.y} ${server.x},${auth.y} ${server.x},${server.y}`;
        }
        return "";
      })
      .attr("stroke", "gray")
      .attr("stroke-width", 4)
      .attr("fill", "none")
      .attr("stroke-linecap", "round");

    // Draw direct full line from Server to Prisma:
    {
      const server = nodes.find(n => n.id === "PolarLearn")!;
      const prisma = nodes.find(n => n.id === "Prisma")!;
      linksGroup.append("line")
        .attr("x1", server.x)
        .attr("y1", server.y)
        .attr("x2", prisma.x)
        .attr("y2", prisma.y)
        .attr("stroke", "gray")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");
    }

    // Draw nodes:
    nodesGroup.selectAll(".node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 10)
      .attr("fill", "white")
      .attr("stroke", "oklch(0.746 0.16 232.661)")
      .attr("stroke-width", 2);

    // Draw node labels:
    nodesGroup.selectAll(".label")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "14px")
      .text(d => d.id);
  }, []);
  const [text, setText] = useState("")

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const header = svg.select("text.header-text");
    if (text) {
      header.interrupt();
      // Clear any old tspans
      header.html("").attr("dy", "0em");
      header.text(text);
      header.style("font-size", "18px")
        .style("opacity", 0)
        .transition()
        .duration(500)
        .style("opacity", 1)
        .transition()
        .delay(1200)
        .duration(500)
        .style("opacity", 0);
    }
  }, [text]);

  // Modify triggerPulse so it returns a promise that resolves after the pulse finishes
  const triggerPulse = (from: string, to: string): Promise<void> => {
    return new Promise(resolve => {
      const svg = d3.select(svgRef.current);
      const linksGroup = svg.select<SVGGElement>(".links-group");
      const link = links.find(l => l.source === from && l.target === to);
      if (!link) {
        resolve();
        return;
      }
      // Set durationTime slower for Client → Server or Server → Client pulses
      let durationTime;
      if (from === "Client (jij)" && to === "PolarLearn") {
        durationTime = 1200;
      } else if (from === "PolarLearn" && to === "Client (jij)") {
        durationTime = 500; // made server → client a little faster
      } else {
        durationTime = 100;
      }

      if (link.custom) {
        let pathData = "";
        if (link.via) {
          const source = nodes.find(n => n.id === link.source)!;
          const via = nodes.find(n => n.id === link.via)!;
          const target = nodes.find(n => n.id === link.target)!;
          pathData = `M${source.x},${source.y} L${source.x},${via.y} L${via.x},${via.y} L${via.x},${target.y} L${target.x},${target.y}`;
        } else if (from === "PolarLearn" && to === "Prisma") {
          const server = nodes.find(n => n.id === "PolarLearn")!;
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const prisma = nodes.find(n => n.id === "Prisma")!;
          pathData = `M${server.x},${server.y} L${server.x},${auth.y} L${auth.x},${auth.y} L${prisma.x},${auth.y} L${prisma.x},${prisma.y}`;
        } else if (from === "PolarLearn" && to === "PolarAuth") {
          const server = nodes.find(n => n.id === "PolarLearn")!;
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          pathData = `M${server.x},${server.y} L${server.x},${auth.y} L${auth.x},${auth.y}`;
        } else if (from === "PolarAuth" && to === "Prisma") {
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const prisma = nodes.find(n => n.id === "Prisma")!;
          const offset = prisma.x - auth.x;
          pathData = `M${auth.x},${auth.y} L${auth.x + offset},${auth.y} L${auth.x + offset},${prisma.y}`;
        } else if (from === "Prisma" && to === "PolarAuth") {
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const prisma = nodes.find(n => n.id === "Prisma")!;
          pathData = `M${prisma.x},${prisma.y} L${prisma.x},${auth.y} L${auth.x},${auth.y}`;
        } else if (from === "PolarAuth" && to === "PolarLearn") {
          const auth = nodes.find(n => n.id === "PolarAuth")!;
          const server = nodes.find(n => n.id === "PolarLearn")!;
          pathData = `M${auth.x},${auth.y} L${server.x},${auth.y} L${server.x},${server.y}`;
        }
        if (pathData !== "") {
          const pulsePath = linksGroup.append("path")
            .attr("d", pathData)
            .attr("stroke", "#38bdf8")
            .attr("stroke-width", 4)
            .attr("fill", "none")
            .attr("stroke-linecap", "round");
          const totalLength = (pulsePath.node() as SVGPathElement).getTotalLength();
          pulsePath
            .attr("stroke-dasharray", `10 ${totalLength - 10}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(durationTime)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", () => {
              pulsePath.remove();
              resolve();
            });
        } else {
          resolve();
        }
      } else {
        const sourceNode = nodes.find(n => n.id === link.source)!;
        const targetNode = nodes.find(n => n.id === link.target)!;
        const lineLength = Math.sqrt(
          Math.pow(targetNode.x - sourceNode.x, 2) +
          Math.pow(targetNode.y - sourceNode.y, 2)
        );
        const pulseLine = linksGroup.append("line")
          .attr("x1", sourceNode.x)
          .attr("y1", sourceNode.y)
          .attr("x2", targetNode.x)
          .attr("y2", targetNode.y)
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 4)
          .attr("stroke-linecap", "round")
          .attr("stroke-dasharray", `10 ${lineLength - 10}`)
          .attr("stroke-dashoffset", lineLength);

        pulseLine.transition()
          .duration(durationTime)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0)
          .on("end", () => {
            pulseLine.remove();
            resolve();
          });
      }
    });
  };

  const loginAnim = async () => {
    const sequence: [string, string][] = [
      ["Client (jij)", "PolarLearn"],
      ["PolarLearn", "PolarAuth"],
      ["PolarAuth", "Prisma"],
      ["Prisma", "Database"],
      ["Database", "Prisma"],
      ["Prisma", "PolarAuth"],
      ["PolarAuth", "PolarLearn"],
      ["PolarLearn", "Client (jij)"]
    ];
    for (const [from, to] of sequence) {
      await triggerPulse(from, to);
    }
    setText(Math.random() < 0.5 ? "Ingelogd!" : "Verkeerde inloggegevens");
  };

  const registerAnim = async () => {
    const sequence: [string, string][] = [
      ["Client (jij)", "PolarLearn"],
      ["PolarLearn", "PolarAuth"],
      ["PolarAuth", "Prisma"],
      ["Prisma", "Database"],
      ["Database", "Prisma"],
      ["Prisma", "PolarAuth"],
      ["PolarAuth", "PolarLearn"],
      ["PolarLearn", "Client (jij)"]
    ];
    for (const [from, to] of sequence) {
      await triggerPulse(from, to);
    }
    setText(Math.random() < 0.5 ? "Aangemaakt!" : "Gebruiker bestaat al.");
  };

  const recentItemsAnim = async () => {
    const sequence: [string, string][] = [
      ["Client (jij)", "PolarLearn"],
      ["PolarLearn", "Prisma"],
      ["Prisma", "Database"],
      ["Database", "Prisma"],
      ["Prisma", "PolarLearn"],
      ["PolarLearn", "Client (jij)"]
    ];
    for (const [from, to] of sequence) {
      await triggerPulse(from, to);
    }
    const messages = ["Economie", "Wiskunde", "NaSk", "Geschiedenis", "Aardrijkskunde", "Biologie", "Nederlands"];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    setText(msg);
  };
  return (
    <div className="flex flex-col items-center justify-center space-y-4 px-5">
      <svg ref={svgRef} width="600" height="300"></svg>
      <p>Kijk hoe PolarLearn werkt met deze knoppen!</p>
      <p className="text-sm">(P.S: Deze knoppen zijn alleen gemaakt voor het voorbeeld hierboven, het doet niks behalve animaties laten zien. De berichten zie worden laten zien, zijn alleen voorbeeldberichten)</p>
      <div className="h-3" />
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button1 text="Log in" onClick={loginAnim} />
        <Button1 text="Account Aanmaken" onClick={registerAnim} />
        <Button1 text="Recent geoefende lijsten en vakken ophalen" onClick={recentItemsAnim} />
      </div>
    </div>
  );
};

export default SecondMarketingComponent;
