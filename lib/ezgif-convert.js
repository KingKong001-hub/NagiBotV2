import { FormData } from 'formdata-node';
import axios from 'axios';

const linksConvert = {
  // ... [tu objeto linksConvert permanece igual, lo omití por espacio]
};

async function convert(fields) {
  if (typeof fields === 'string' && fields?.toLowerCase() === 'list') return Object.keys(linksConvert);

  let type = linksConvert?.[fields?.type];
  if (!type) throw new Error(`Invalid conversion type "${fields?.type}"`);
  let form = new FormData();

  if (fields?.file) {
    if (!fields.filename) throw new Error(`filename must be provided to upload files (with extension).`);
    form.append('new-image', fields.file, {
      filename: fields.filename,
    });
  } else if (fields?.url) {
    form.append('new-image-url', fields.url);
  } else throw new Error('Either file or url field is required.');

  delete fields.type;
  delete fields.file;
  delete fields.filename;
  delete fields.url;

  let org_keys = Object.keys(fields);
  if (type.req_params) {
    type.req_params.forEach(e => {
      if (!org_keys.includes(e)) throw new Error(`"${e}" is a required param.`);
    });
  }
  if (type.either_params.length) {
    let check = false;
    type.either_params.forEach(e => {
      if (org_keys.includes(e)) check = true;
    });
    if (!check) throw new Error(`Either one of these params has to be provided: ${type.either_params.join(', ')}`);
  }

  let link = await axios({
    method: 'post',
    url: type.url,
    headers: { 'Content-Type': 'multipart/form-data' },
    data: form,
  }).catch(handleAxiosError);

  let redir = String(link?.request?.res?.responseUrl);
  if (!redir) throw new Error(`Oops! Something unknown happened!`);
  let id = redir.split('/').pop();
  type.params.file = id;

  let image = await axios({
    method: 'post',
    url: `${redir}?ajax=true`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({
      ...type.params,
      ...fields,
    }),
  }).catch(handleAxiosError);

  let img_url = `https:${(image?.data?.toString()?.split(type.split.start)?.[1]?.split(type.split.end)?.[0])?.replace('https:', '')}`;
  if (img_url.includes('undefined')) throw new Error(`Something unknown happened here... please report to the creator`);
  return img_url;
}

async function overlay(fields) {
  const form = new FormData();
  form.append('new-image', fields.file, {
    filename: fields.filename,
  });

  const uploadRes = await axios({
    method: 'post',
    url: 'https://ezgif.com/overlay',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: form,
  }).catch(handleAxiosError);

  const redir = String(uploadRes?.request?.res?.responseUrl);
  if (!redir) throw new Error(`Oops! Something unknown happened!`);

  const formOverlay = new FormData();
  formOverlay.append('new-overlay', fields.overlay.file, {
    filename: fields.overlay.filename,
  });
  formOverlay.append('overlay', 'Upload image!');

  const overlayRes = await axios({
    method: 'post',
    url: redir,
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formOverlay,
  }).catch(handleAxiosError);

  const redirOverlay = String(overlayRes?.request?.res?.responseUrl);
  if (!redirOverlay) throw new Error(`Oops! Something unknown happened!`);
  const id = redirOverlay.split('/').pop();

  const finalForm = new URLSearchParams({
    file: id,
    pos_x: fields?.pos_x ?? '0',
    pos_y: fields?.pos_y ?? '0',
    opacity: fields?.opacity ?? '100',
    overlay_submit: 'Apply overlay!',
  });

  const result = await axios({
    method: 'post',
    url: `${redirOverlay}?ajax=true`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: finalForm,
  }).catch(handleAxiosError);

  const start = "<img src=\"";
  const end = "\" style=\"width:";
  const imgUrl = `https:${result.data.toString().split(start)[1].split(end)[0].replace('https:', '')}`;
  if (imgUrl.includes('undefined')) throw new Error(`Something unknown happened... please report to the creator`);
  return imgUrl;
}

function handleAxiosError(error) {
  if (error.response) {
    throw new Error(JSON.stringify({
      statusCode: error.response.status,
      data: error.response.data.length ? error.response.data : "Try again. If it continues, report to the creator.",
    }, null, 4));
  } else {
    throw new Error("Oops, something unknown happened! :(");
  }
}
