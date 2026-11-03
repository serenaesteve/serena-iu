/* =========================================================
   ESTILOS COMUNES
   Cada token admite una variable --gota-* desde fuera. Si nadie
   la define se usa el tema propio de la librería, el de Serena:
   ciruela sobre rosa empolvado, con modo oscuro invertido.
   (El tema azul «agua clara» está en temas/agua.css.)
   ========================================================= */
const ESTILOS_COMUNES = `
:host{
	--_acento:var(--gota-acento,#2A2026);
	--_acento-suave:var(--gota-acento-suave,rgb(248 196 214 / .55));
	--_sobre-acento:var(--gota-sobre-acento,#FFFFFF);
	--_tinta:var(--gota-tinta,#1B1216);
	--_tinta-suave:var(--gota-tinta-suave,#7A6770);
	--_campo:var(--gota-campo,#FFFFFF);
	--_campo-foco:var(--gota-campo-foco,#FFFFFF);
	--_panel:var(--gota-panel,#FFFBFC);
	--_linea:var(--gota-linea,rgb(42 32 38 / .14));
	--_boton:var(--gota-boton,rgb(42 32 38 / .05));
	--_boton-hover:var(--gota-boton-hover,rgb(42 32 38 / .09));
	--_sombra:var(--gota-sombra,0 18px 40px rgb(120 100 110 / .24));
	--_sombra-campo:var(--gota-sombra-campo,inset 0 0 0 1px rgb(42 32 38 / .1),0 1px 2px rgb(120 100 110 / .12));
	--_peligro:var(--gota-peligro,#C2415B);
	--_aviso:var(--gota-aviso,#C98A2E);
	--_exito:var(--gota-exito,#3F9A72);
	--_radio:var(--gota-radio,18px);
	--_radio-panel:var(--gota-radio-panel,24px);
	--_fuente:var(--gota-fuente,inherit);
	--_fuente-titulo:var(--gota-fuente-titulo,"Playfair Display",Georgia,serif);
	--_alto:var(--gota-alto,40px);
	font-family:var(--_fuente);
	color:var(--_tinta);
	box-sizing:border-box;
}
@media (prefers-color-scheme:dark){
	:host{
		--_acento:var(--gota-acento,#EDE4E8);
		--_acento-suave:var(--gota-acento-suave,rgb(248 196 214 / .22));
		--_sobre-acento:var(--gota-sobre-acento,#1A1216);
		--_tinta:var(--gota-tinta,#F7EEF2);
		--_tinta-suave:var(--gota-tinta-suave,#A7929C);
		--_campo:var(--gota-campo,rgb(247 238 242 / .06));
		--_campo-foco:var(--gota-campo-foco,rgb(247 238 242 / .1));
		--_panel:var(--gota-panel,#21161C);
		--_linea:var(--gota-linea,rgb(237 228 232 / .14));
		--_boton:var(--gota-boton,rgb(237 228 232 / .07));
		--_boton-hover:var(--gota-boton-hover,rgb(237 228 232 / .14));
		--_sombra:var(--gota-sombra,0 18px 40px rgb(0 0 0 / .55));
		--_sombra-campo:var(--gota-sombra-campo,inset 0 0 0 1px rgb(237 228 232 / .1));
		--_peligro:var(--gota-peligro,#EE7A92);
		--_aviso:var(--gota-aviso,#E8B266);
		--_exito:var(--gota-exito,#7CCBA5);
	}
}
:host([hidden]){display:none;}
*,*::before,*::after{box-sizing:border-box;}
button,input{font:inherit;color:inherit;}
button{cursor:pointer;}
.icono{width:1.15em;height:1.15em;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}

/* La gota: luz por arriba y cáustica por abajo, como una gota sobre un cristal */
.gota{
	position:absolute;left:0;top:0;z-index:0;
	pointer-events:none;
	border-radius:999px;
	background:
		radial-gradient(70% 55% at 50% 108%,color-mix(in oklab,white 42%,transparent),transparent 72%),
		var(--_acento);
	box-shadow:
		inset 0 1px 1px color-mix(in oklab,white 55%,transparent),
		inset 0 -1px 2px color-mix(in oklab,black 18%,transparent),
		0 2px 6px color-mix(in oklab,var(--_acento) 40%,transparent);
}

/* La caja de campo que comparten todos los controles con texto */
.caja{
	display:flex;align-items:stretch;
	min-height:var(--_alto);
	border:1px solid transparent;
	border-radius:var(--_radio);
	background:var(--_campo);
	box-shadow:var(--_sombra-campo);
	transition:border-color .2s,background .2s,box-shadow .2s;
}
.caja:focus-within{
	border-color:var(--_acento);
	background:var(--_campo-foco);
	box-shadow:0 0 0 4px var(--_acento-suave);
}
:host([aria-invalid="true"]) .caja{border-color:var(--_peligro);}
:host([disabled]) .caja,:host(:disabled) .caja{opacity:.5;}
:host([readonly]) .caja{opacity:.65;}
.entrada{
	flex:1;min-width:0;width:100%;
	border:0;background:none;outline:none;
	padding:0 14px;
}
.entrada::placeholder{color:var(--_tinta-suave);opacity:.8;}
.marca{display:flex;align-items:center;padding-left:12px;color:var(--_tinta-suave);}
.marca + .entrada{padding-left:9px;}
.mando{
	flex:none;display:grid;place-items:center;width:38px;
	border:0;background:none;color:var(--_tinta-suave);
	border-radius:var(--_radio);
	transition:color .15s,background .15s;
}
.mando:focus-visible{outline:2px solid var(--_acento);outline-offset:-3px;}
@media (hover:hover){
	.mando:hover:not(:disabled){color:var(--_tinta);background:var(--_boton-hover);}
}
.mando:active:not(:disabled){transform:scale(.92);}
.panel{
	position:fixed;inset:auto;margin:0;
	max-width:min(360px,calc(100vw - 16px));
	padding:6px;
	color:var(--_tinta);
	font-family:var(--_fuente);
	background:var(--_panel);
	border:1px solid var(--_linea);
	border-radius:var(--_radio-panel);
	box-shadow:var(--_sombra);
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;}}
`;
