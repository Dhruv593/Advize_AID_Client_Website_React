import { Link } from 'react-router-dom';
export default function Capabilities() {
  return (
    <>


<main id={"main-content"}>
<section className={"section page-hero"}>
<div className={"section-top"}>
<span>02 / CAPABILITIES</span><span>PEOPLE · PLANT · DELIVERY</span>
</div>
<div className={"eyebrow"}><i></i>BUILT TO GET THE WORK DONE</div>
<h1>From ground<br /><em>to delivery.</em></h1>
<p className={"page-lede"}>
          Four development verticals, supported by equipment and maintenance
          capability. Explore the work and identify the right enquiry path.
        </p>
</section>
<p className={"content-note"}>
        Residential and commercial visuals now use client-supplied project
        imagery. Industrial and infrastructure imagery remains illustrative
        until AID provides approved project-specific visuals.
      </p>
<section className={"section"}>
<div className={"section-top"}>
<span>FOUR DEVELOPMENT VERTICALS</span><span>CONNECTED AREAS OF WORK</span>
</div>
<article className={"vertical-detail"} id={"residential"}>
<div className={"vertical-image"}>
<img alt={"Golf Villa project visual supplied by AID"} src={"/images/client-projects/golf-villa.webp"} /><span>01 / RESIDENTIAL</span>
</div>
<div>
<div className={"eyebrow"}><i></i>PLACES TO LIVE</div>
<h2>Residential<br /><em>development.</em></h2>
<p className={"intro-lede"}>
              Villas, guest houses and residential communities.
            </p>
<p>
              Use this area to present approved residential work, photography,
              scale and design or quality standards provided by AID.
            </p>
<Link className={"button-primary"} to={"/contact?interest=residential"} data-router-link={"true"}>Enquire about residential <span>↗</span></Link>
</div>
</article>
<article className={"vertical-detail"} id={"commercial"}>
<div className={"vertical-image"}>
<img alt={"Mall of Lubumbashi project visual supplied by AID; project status to confirm"} src={"/images/client-projects/mall-of-lubumbashi.webp"} /><span>02 / COMMERCIAL</span>
</div>
<div>
<div className={"eyebrow"}><i></i>PLACES TO DO BUSINESS</div>
<h2>Commercial<br /><em>development.</em></h2>
<p className={"intro-lede"}>
              Retail, leisure, office and mixed-use environments.
            </p>
<p>
              The proposal identifies Jambo Mart retail developments in Kolwezi
              and Fungurume. Confirm project details and the approved public
              naming before adding case studies.
            </p>
<Link className={"button-primary"} to={"/contact?interest=commercial"} data-router-link={"true"}>Enquire about commercial <span>↗</span></Link>
</div>
</article>
<article className={"vertical-detail"} id={"industrial"}>
<div className={"vertical-image"}>
<img alt={"Illustrative built-environment reference; industrial project imagery not yet supplied"} src={"/images/aid-industrial.jpg"} /><span>03 / INDUSTRIAL</span>
</div>
<div>
<div className={"eyebrow"}><i></i>PLACES THAT PRODUCE</div>
<h2>Industrial<br /><em>development.</em></h2>
<p className={"intro-lede"}>
              Facilities and sites planned around operational needs.
            </p>
<p>
              Content may cover manufacturing plants, warehouses, distribution
              centres and maize mill installations, with approved images and
              documented scope.
            </p>
<Link className={"button-primary"} to={"/contact?interest=industrial"} data-router-link={"true"}>Enquire about industrial <span>↗</span></Link>
</div>
</article>
<article className={"vertical-detail"} id={"infrastructure"}>
<div className={"vertical-image"}>
<img alt={"Illustrative road infrastructure reference image"} src={"/images/closing-realistic-road.png"} /><span>04 / INFRASTRUCTURE</span>
</div>
<div>
<div className={"eyebrow"}><i></i>CONNECTIONS THAT MATTER</div>
<h2>Infrastructure<br /><em>development.</em></h2>
<p className={"intro-lede"}>
              Road construction, site preparation and essential connections.
            </p>
<p>
              The proposal lists road construction, bush clearing, land
              levelling and utilities. Add only confirmed project examples and
              technical details.
            </p>
<Link className={"button-primary"} to={"/contact?interest=infrastructure"} data-router-link={"true"}>Enquire about infrastructure <span>↗</span></Link>
</div>
</article>
</section>
<section className={"section fleet-strip"}>
<div className={"fleet-heading"}>
<span className={"mini-label"}>FLEET & EQUIPMENT</span>
<h3>Resources to support delivery.</h3>
<p>
            Equipment categories listed in the website proposal. Confirm current
            inventory and specifications before launch.
          </p>
</div>
<div className={"fleet-list"}>
<div className={"fleet-row"}>
<span>01</span>
<div>
<b>Earthmoving</b>
<p>
                Caterpillar excavators (20–35 t) · D8 dozers · 16H motor graders
              </p>
</div>
<i>↗</i>
</div>
<div className={"fleet-row"}>
<span>02</span>
<div>
<b>Construction vehicles</b>
<p>TLBs · Compactors · Other construction vehicles</p>
</div>
<i>↗</i>
</div>
<div className={"fleet-row"}>
<span>03</span>
<div>
<b>Transport and lifting</b>
<p>
                Tippers (proposal lists 40-ton GVW) · Volvo 440 HP tractor units
                · Mobile cranes
              </p>
</div>
<i>↗</i>
</div>
<div className={"fleet-row"}>
<span>04</span>
<div>
<b>Agriculture and concrete</b>
<p>
                John Deere tractors (proposal lists 75–640 HP) · Mobile concrete
                batching plants
              </p>
</div>
<i>↗</i>
</div>
<div className={"fleet-row"}>
<span>05</span>
<div>
<b>Equipment support</b>
<p>In-house maintenance team</p>
</div>
<i>↗</i>
</div>
</div>
</section>
<section className={"section"}>
<div className={"section-top"}>
<span>FLEET FIGURES</span><span>PROPOSAL-SUPPLIED · VERIFY</span>
</div>
<div className={"fleet-spec-grid"}>
<article>
<strong>15</strong><span>Construction vehicles stated in proposal</span>
</article>
<article>
<strong>15</strong><span>Tippers stated in proposal</span>
</article>
<article>
<strong>30</strong><span>Volvo 440 HP tractor units stated in proposal</span>
</article>
<article>
<strong>55</strong><span>John Deere tractors stated in proposal</span>
</article>
<article>
<strong>20–35 t</strong><span>Excavator range stated in proposal</span>
</article>
<article>
<strong>75–640 HP</strong><span>Tractor power range stated in proposal</span>
</article>
</div>
<p className={"content-note"}>
          All quantities, models, terminology and availability must be confirmed
          against AID’s current fleet inventory.
        </p>
</section>
<section className={"page-cta"}>
<div>
<div className={"eyebrow"}><i></i>PROJECT ENQUIRIES</div>
<h2>What are you looking to build?</h2>
<p>Tell us the development vertical, location and project scope.</p>
</div>
<Link className={"button-primary"} to={"/contact"} data-router-link={"true"}>Discuss a project <span>↗</span></Link>
</section>
</main>
    </>
  );
}
