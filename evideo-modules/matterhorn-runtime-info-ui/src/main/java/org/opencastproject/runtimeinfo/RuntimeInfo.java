/**
 *  Copyright 2009, 2010 The Regents of the University of California
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
package org.opencastproject.runtimeinfo;

import org.opencastproject.rest.RestConstants;
import org.opencastproject.security.api.SecurityService;
import org.opencastproject.util.DocUtil;
import org.opencastproject.util.doc.DocRestData;
import org.opencastproject.util.doc.Format;
import org.opencastproject.util.doc.RestEndpoint;
import org.opencastproject.util.doc.RestTestForm;

import org.apache.commons.lang.StringUtils;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.osgi.framework.BundleContext;
import org.osgi.framework.Constants;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Comparator;
import java.util.SortedSet;
import java.util.TreeSet;

import javax.servlet.Servlet;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 * This REST endpoint provides information about the runtime environment, including the services and user interfaces
 * deployed and the current login context.
 * 
 * If the 'org.opencastproject.anonymous.feedback.url' is set in config.properties, this service will also update the
 * opencast project with the contents of the {@link #getRuntimeInfo()} json feed.
 */
@Path("/")
public class RuntimeInfo {
  private static final long serialVersionUID = 1L;
  private static final Logger logger = LoggerFactory.getLogger(RuntimeInfo.class);

  /** The rest publisher looks for any non-servlet with the 'opencast.service.path' property */
  public static final String SERVICE_FILTER = "(&(!(objectClass=javax.servlet.Servlet))(" + RestConstants.SERVICE_PATH_PROPERTY
          + "=*))";

  private SecurityService securityService;
  private BundleContext bundleContext;
  private String serverUrl;
  private String engageBaseUrl;
  private String adminBaseUrl;
  private String docs;

  protected void setSecurityService(SecurityService securityService) {
    this.securityService = securityService;
  }

  protected ServiceReference[] getRestServiceReferences() throws InvalidSyntaxException {
    return bundleContext.getAllServiceReferences(null, SERVICE_FILTER);
  }

  protected ServiceReference[] getUserInterfaceServiceReferences() throws InvalidSyntaxException {
    return bundleContext.getAllServiceReferences(Servlet.class.getName(), "(&(alias=*)(classpath=*))");
  }

  public void activate(ComponentContext cc) {
    logger.debug("start()");
    this.bundleContext = cc.getBundleContext();
    this.adminBaseUrl = bundleContext.getProperty("org.opencastproject.admin.ui.url");
    if (adminBaseUrl == null)
      adminBaseUrl = serverUrl;
    this.engageBaseUrl = bundleContext.getProperty("org.opencastproject.engage.ui.url");
    if (engageBaseUrl == null)
      engageBaseUrl = serverUrl;
    this.serverUrl = bundleContext.getProperty("org.opencastproject.server.url");

    String serviceUrl = (String) cc.getProperties().get(RestConstants.SERVICE_PATH_PROPERTY);
    docs = generateDocs(serviceUrl);
  }

  public void deactivate() {
    // Nothing to do
  }

  protected String generateDocs(String serviceUrl) {
    DocRestData data = new DocRestData("RuntimeInfo", "Runtime Information", serviceUrl, null);

    // abstract
    data.setAbstract("This service provides information about the runtime environment, including the servives that are"
            + "deployed and the current user context.");

    // services
    RestEndpoint servicesEndpoint = new RestEndpoint("services", RestEndpoint.Method.GET, "/components.json", "List "
            + "the REST services and user interfaces running on this host");
    servicesEndpoint.addFormat(new Format("JSON", null, null));
    servicesEndpoint.addStatus(org.opencastproject.util.doc.Status.ok("The components running on this host"));
    servicesEndpoint.setTestForm(RestTestForm.auto());
    data.addEndpoint(RestEndpoint.Type.READ, servicesEndpoint);

    // me
    RestEndpoint meEndpoint = new RestEndpoint("me", RestEndpoint.Method.GET, "/me.json",
            "Information about the curent user");
    meEndpoint.addFormat(new Format("JSON", null, null));
    meEndpoint.addStatus(org.opencastproject.util.doc.Status.ok("Returns information about the current user"));
    meEndpoint.setTestForm(RestTestForm.auto());
    data.addEndpoint(RestEndpoint.Type.READ, meEndpoint);

    logger.debug("generated documentation for {}", data);

    return DocUtil.generate(data);
  }

  @GET
  @Produces(MediaType.TEXT_HTML)
  @Path("docs")
  public String getDocumentation() {
    return docs;
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("components.json")
  @SuppressWarnings("unchecked")
  public String getRuntimeInfo() {
    JSONObject json = new JSONObject();
    json.put("engage", engageBaseUrl);
    json.put("admin", adminBaseUrl);
    json.put("rest", getRestEndpointsAsJson());
    json.put("ui", getUserInterfacesAsJson());
    return json.toJSONString();
  }

  @GET
  @Path("me.json")
  @Produces(MediaType.APPLICATION_JSON)
  @SuppressWarnings("unchecked")
  public String getMyInfo() {
    String username = securityService.getUserId();
    JSONArray roles = new JSONArray();
    for (String role : securityService.getRoles()) {
      roles.add(role);
    }
    JSONObject json = new JSONObject();
    json.put("username", username);
    json.put("roles", roles);
    return json.toJSONString();
  }

  @SuppressWarnings("unchecked")
  protected JSONArray getRestEndpointsAsJson() {
    JSONArray json = new JSONArray();
    ServiceReference[] serviceRefs = null;
    try {
      serviceRefs = getRestServiceReferences();
    } catch (InvalidSyntaxException e) {
      e.printStackTrace();
    }
    if (serviceRefs == null)
      return json;
    for (ServiceReference servletRef : sort(serviceRefs)) {
      String version = servletRef.getBundle().getVersion().toString();
      String description = (String) servletRef.getProperty(Constants.SERVICE_DESCRIPTION);
      String servletContextPath = (String) servletRef.getProperty(RestConstants.SERVICE_PATH_PROPERTY);
      JSONObject endpoint = new JSONObject();
      endpoint.put("description", description);
      endpoint.put("version", version);
      endpoint.put("docs", serverUrl + servletContextPath + "/docs"); // This is a Matterhorn convention
      endpoint.put("wadl", serverUrl + servletContextPath + "/?_wadl&_type=xml"); // This triggers a CXF-specific handler
      json.add(endpoint);
    }
    return json;
  }

  @SuppressWarnings("unchecked")
  protected JSONArray getUserInterfacesAsJson() {
    JSONArray json = new JSONArray();
    ServiceReference[] serviceRefs = null;
    try {
      serviceRefs = getUserInterfaceServiceReferences();
    } catch (InvalidSyntaxException e) {
      e.printStackTrace();
    }
    if (serviceRefs == null)
      return json;
    for (ServiceReference ref : sort(serviceRefs)) {
      String description = (String) ref.getProperty(Constants.SERVICE_DESCRIPTION);
      String version = ref.getBundle().getVersion().toString();
      String alias = (String) ref.getProperty("alias");
      String welcomeFile = (String) ref.getProperty("welcome.file");
      String welcomePath = "/".equals(alias) ? alias + welcomeFile : alias + "/" + welcomeFile;
      JSONObject endpoint = new JSONObject();
      endpoint.put("description", description);
      endpoint.put("version", version);
      endpoint.put("welcomepage", serverUrl + welcomePath);
      json.add(endpoint);
    }
    return json;
  }

  /**
   * Returns the array of references sorted by their {@link Constants.SERVICE_DESCRIPTION} property.
   * 
   * @param references
   *          the referencens
   * @return the sorted set of references
   */
  protected SortedSet<ServiceReference> sort(ServiceReference[] references) {
    // Sort the service references
    SortedSet<ServiceReference> sortedServiceRefs = new TreeSet<ServiceReference>(new Comparator<ServiceReference>() {
      @Override
      public int compare(ServiceReference o1, ServiceReference o2) {
        String o1Description = (String) o1.getProperty(Constants.SERVICE_DESCRIPTION);
        if (StringUtils.isBlank(o1Description))
          o1Description = o1.toString();
        String o2Description = (String) o2.getProperty(Constants.SERVICE_DESCRIPTION);
        if (StringUtils.isBlank(o2Description))
          o2Description = o2.toString();
        return o1Description.compareTo(o2Description);
      }
    });
    sortedServiceRefs.addAll(Arrays.asList(references));
    return sortedServiceRefs;
  }

}
