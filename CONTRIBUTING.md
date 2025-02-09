# Bijdragen aan PolarLearn

Allereerst, bedankt dat u de tijd heeft genomen om bij te dragen!

Alle soorten bijdragen worden aangemoedigd en gewaardeerd. Zie de [Inhoudsopgave](#inhoudsopgave) voor verschillende manieren om te helpen en details over hoe dit project hiermee omgaat. Zorg ervoor dat u de relevante sectie leest voordat u uw bijdrage levert. Het zal het een stuk makkelijker maken voor ons, de beheerders, en de ervaring voor alle betrokkenen soepeler maken. De community kijkt uit naar uw bijdragen.

> En als u het project leuk vindt, maar gewoon geen tijd hebt om bij te dragen, is dat prima. Er zijn andere eenvoudige manieren om het project te steunen en je waardering te tonen, waar we ook erg blij mee zouden zijn:
> - Star PolarLearn
> - Verwijs naar dit project in de readme van je project
> - Vermeld het project op lokale bijeenkomsten en vertel het aan je vrienden/collega's

## Inhoudsopgave

- [Gedragscode](#gedragscode)
- [Ik heb een vraag](#ik-heb-een-vraag)
- [Ik wil bijdragen](#ik-wil-bijdragen)
- [Bugs melden](#bugs-melden)
- [Verbeteringen voorstellen](#verbeteringen-voorstellen)
- [Je eerste codebijdrage](#je-eerste-codebijdrage)
- [De documentatie verbeteren](#de-documentatie-verbeteren)
- [Stijlgidsen](#stijlgidsen)
- [Commit Berichten](#commit-berichten)
- [Word lid van het projectteam](#word lid van het projectteam)

## Gedragscode

Dit project en iedereen die eraan deelneemt, vallen onder de
[Polar Gedragscode](https://github.com/polarnl/PolarLearn/blob/stable/CODE_OF_CONDUCT.md).
Door deel te nemen, wordt van u verwacht dat u zich aan deze code houdt. Meld onacceptabel gedrag aan `.andrei1010` op discord.

## Ik heb een vraag

> Als u een vraag wilt stellen, gaan we ervan uit dat u de beschikbare [Documentatie](https://github.com/polarnl/PolarLearn/wiki) hebt gelezen.

Voordat u een vraag stelt, kunt u het beste zoeken naar bestaande [Issues](https://github.com/polarnl/PolarLearn/issues) die u kunnen helpen. Als u een geschikt probleem hebt gevonden en nog steeds verduidelijking nodig hebt, kunt u uw vraag in dit probleem schrijven. Het is ook raadzaam om eerst op internet naar antwoorden te zoeken.

Als u dan nog steeds de behoefte voelt om een ​​vraag te stellen en verduidelijking nodig hebt, raden we het volgende aan:

- Open een [Issue](https://github.com/polarnl/PolarLearn/issues).
- Geef zoveel mogelijk context over waar u tegenaan loopt.
- Geef project- en platformversies (nodejs, npm, etc.), afhankelijk van wat relevant lijkt.

We zullen het probleem dan zo snel mogelijk oplossen.

## Ik wil bijdragen

> ### Juridische kennisgeving
> Wanneer u bijdraagt ​​aan dit project, moet u ermee akkoord gaan dat u 100% van de content hebt geschreven, dat u de benodigde rechten op de content hebt en dat de content die u bijdraagt ​​onder de projectlicentie mag worden verstrekt.

### Bugs melden

#### Voordat u een bugrapport indient

Een goed bugrapport mag er niet toe leiden dat anderen u moeten achtervolgen voor meer informatie. Daarom vragen we u om het zorgvuldig te onderzoeken, informatie te verzamelen en het probleem gedetailleerd te beschrijven in uw rapport. Voltooi de volgende stappen van tevoren om ons te helpen mogelijke bugs zo snel mogelijk op te lossen.

- Zorg ervoor dat u de nieuwste versie gebruikt.
- Bepaal of uw bug echt een bug is en geen fout van uw kant, bijvoorbeeld door het gebruik van incompatibele omgevingscomponenten/versies (zorg ervoor dat u de [documentatie](https://github.com/polarnl/PolarLearn/wiki) hebt gelezen). Als u op zoek bent naar ondersteuning, kunt u [dit gedeelte](#i-have-a-question)) raadplegen.
- Om te zien of andere gebruikers hetzelfde probleem hebben ervaren (en mogelijk al hebben opgelost) als u, controleert u of er nog geen bugrapport voor uw bug of fout bestaat in de [bugtracker](issues?q=label%3Abug).
- Zoek ook op internet (inclusief Stack Overflow) om te zien of gebruikers buiten de GitHub-community het probleem hebben besproken.
- Verzamel informatie over de bug:
- Stack trace (Traceback)
- OS, platform en versie (Windows, Linux, macOS, x86, ARM)
- Versie van de interpreter, compiler, SDK, runtime-omgeving, pakketbeheerder, afhankelijk van wat relevant lijkt.
- Mogelijk uw invoer en de uitvoer
- Kunt u het probleem betrouwbaar reproduceren? En kunt u het ook reproduceren met oudere versies?

#### Hoe dien ik een goed bugrapport in?

> U mag nooit beveiligingsgerelateerde problemen, kwetsbaarheden of bugs, inclusief gevoelige informatie, melden aan de issue tracker of elders in het openbaar. In plaats daarvan moeten gevoelige bugs per e-mail worden verzonden naar .andrei1010 op discord.

We gebruiken GitHub-problemen om bugs en fouten bij te houden. Als u een probleem met het project tegenkomt:

- Open een [Issue](https://github.com/polarnl/PolarLearn/issues). (Aangezien we op dit punt niet zeker kunnen zijn of het een bug is of niet, vragen we u om nog niet over een bug te praten en het probleem niet te labelen.)
- Leg uit welk gedrag u zou verwachten en wat het daadwerkelijke gedrag is.
- Geef zoveel mogelijk context en beschrijf de *reproductiestappen* die iemand anders kan volgen om het probleem zelf te reproduceren. Dit omvat meestal uw code. Voor goede bugrapporten moet u het probleem isoleren en een gereduceerde testcase maken.
- Geef de informatie die u in de vorige sectie hebt verzameld.

Zodra het is ingediend:

- Het projectteam zal de issu dienovereenkomstig.
- Een teamlid zal proberen het probleem te reproduceren met de stappen die u hebt opgegeven. Als er geen reproductiestappen zijn of geen duidelijke manier om het probleem te reproduceren, zal het team u om die stappen vragen en het probleem markeren als `needs-repro`. Bugs met de tag `needs-repro` worden niet aangepakt totdat ze zijn gereproduceerd.
- Als het team het probleem kan reproduceren, wordt het gemarkeerd als `needs-fix`, evenals mogelijk andere tags (zoals `critical`), en wordt het probleem overgelaten aan [iemand die het kan implementeren](#your-first-code-contribution).

### Verbeteringen voorstellen

Deze sectie begeleidt u bij het indienen van een verbeteringsvoorstel voor CONTRIBUTING.md, **inclusief volledig nieuwe functies en kleine verbeteringen aan bestaande functionaliteit**. Door deze richtlijnen te volgen, kunnen beheerders en de community uw suggestie begrijpen en gerelateerde suggesties vinden.

#### Voordat u een verbetering indient

- Zorg ervoor dat u de nieuwste versie gebruikt.
- Lees de [documentatie](https://github.com/polarnl/PolarLearn/wiki) zorgvuldig door en zoek uit of de functionaliteit al is behandeld, bijvoorbeeld door een individuele configuratie.
- Voer een zoekopdracht uit om te zien of de verbetering al is voorgesteld. Als dat zo is, voeg dan een opmerking toe aan het bestaande probleem in plaats van een nieuw probleem te openen.
- Zoek uit of je idee past bij de scope en doelstellingen van het project. Het is aan jou om een ​​sterk betoog te houden om de ontwikkelaars van het project te overtuigen van de voordelen van deze functie. Houd er rekening mee dat we functies willen die nuttig zijn voor de meerderheid van onze gebruikers en niet alleen voor een kleine subgroep. Als je je alleen richt op een minderheid van de gebruikers, overweeg dan om een ​​fork/add-on te schrijven.

#### Hoe dien ik een goede verbeteringssuggestie in?

Verbeteringssuggesties worden bijgehouden als [GitHub Issues](https://github.com/polarnl/PolarLearn/issues).

- Gebruik een **duidelijke en beschrijvende titel** voor het probleem om de suggestie te identificeren.
- Geef een **stapsgewijze beschrijving van de voorgestelde verbetering** in zoveel mogelijk details.
- **Beschrijf het huidige gedrag** en **leg uit welk gedrag je in plaats daarvan verwachtte te zien** en waarom. Op dit punt kun je ook aangeven welke alternatieven niet voor jou werken.
- Je kunt **screenshots en geanimeerde GIF's of video's** toevoegen die je helpen de stappen te demonstreren of het onderdeel aanwijzen waar de suggestie betrekking op heeft. Je kunt [deze tool](https://www.cockos.com/licecap/) gebruiken om GIF's op te nemen op macOS en Windows, en [deze tool](https://github.com/colinkeenan/silentcast) of [deze tool](https://github.com/GNOME/byzanz) op Linux.
- **Leg uit waarom deze verbetering nuttig zou zijn** voor de meeste CONTRIBUTING.md-gebruikers. Je kunt ook wijzen op de andere projecten die het beter hebben opgelost en die als inspiratie kunnen dienen.

### Uw eerste codebijdrage


### De documentatie verbeteren
Open een Pull Request met de verbeterde documentatie.

## Stijlgidsen:
- Gebruik al de bestaande componenten, die zijn te vinden in `src/components`.
- Voor de gradient, is er een sky-400 (#38bdf8) naar sky-100 (#e0f2fe).
- De lichtere achtergrondskleur is neutral-700 (#404040), de donkerdere is neutral-800 (#262626)

### Commit-berichten
De enige regels voor commits zijn:
 - Onderteken je commits (Kan via GPG, of iets anders.) Zolang er "Verified" staat, is het oke.
 - Schrijf in het commit-bericht alles wat er toegevoegs/gewijzigd is. 

## Word lid van het projectteam
Contacteer `.andrei1010` op discord

## Toeschrijving
Deze gids is gebaseerd op **contributing.md**. [Maak uw eigen](https://contributing.md/)!
